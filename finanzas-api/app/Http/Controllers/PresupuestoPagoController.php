<?php

namespace App\Http\Controllers;

use App\Http\Requests\GuardarPresupuestoPagoRequest;
use App\Models\PresupuestoPago;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PresupuestoPagoController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $hoy = CarbonImmutable::today('America/Guatemala');

        return $this->resumen($usuario, $usuario->presupuestoPago()->first(), $hoy);
    }

    public function update(GuardarPresupuestoPagoRequest $request): JsonResponse
    {
        $hoy = CarbonImmutable::today('America/Guatemala');
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $hoy, $datos) {
            // El bloqueo del usuario serializa cambios incluso antes de que exista un presupuesto.
            $usuario = User::query()->lockForUpdate()->findOrFail($request->user()->getKey());
            $presupuesto = $usuario->presupuestoPago()->firstOrNew();
            $fechaInicio = $datos['fecha_inicio'] ?? $presupuesto->fecha_inicio?->toDateString() ?? $hoy->toDateString();
            $fechaPago = $datos['fecha_pago'];

            if ($fechaInicio > $hoy->toDateString()) {
                throw ValidationException::withMessages(['fecha_inicio' => 'El seguimiento debe empezar hoy o en una fecha anterior.']);
            }

            if ($fechaPago <= $fechaInicio) {
                throw ValidationException::withMessages(['fecha_pago' => 'El cobro debe ser posterior al inicio.']);
            }

            if ($fechaPago <= $hoy->toDateString() && $fechaPago !== $presupuesto->fecha_pago?->toDateString()) {
                throw ValidationException::withMessages(['fecha_pago' => 'El próximo cobro debe ser después de hoy.']);
            }

            $presupuesto->fill([
                'limite' => $datos['limite'],
                'fecha_inicio' => $fechaInicio,
                'fecha_pago' => $fechaPago,
            ])->save();

            return $this->resumen($usuario, $presupuesto, $hoy);
        });
    }

    private function resumen(User $usuario, ?PresupuestoPago $presupuesto, CarbonImmutable $hoy): JsonResponse
    {
        if (! $presupuesto) {
            return response()->json(['hoy' => $hoy->toDateString(), 'presupuesto' => null]);
        }

        $inicio = $presupuesto->fecha_inicio->toDateString();
        $pago = $presupuesto->fecha_pago->toDateString();
        $hasta = min($pago, $hoy->addDay()->toDateString());
        $egresos = $usuario->egresos()->where('fecha', '>=', $inicio)->where('fecha', '<', $hasta);

        if ($egresos->getConnection()->getDriverName() === 'sqlite') {
            // SQLite almacena DECIMAL con afinidad numérica. Sumar centavos evita acumular errores de coma flotante.
            $centavos = $egresos->sum(DB::raw('CAST(ROUND(monto * 100) AS INTEGER)'));
            $gastado = bcdiv((string) $centavos, '100', 2);
        } else {
            $gastado = bcadd((string) $egresos->sum('monto'), '0', 2);
        }

        $limite = $presupuesto->limite;
        $comparacion = bccomp($gastado, $limite, 2);

        return response()->json([
            'hoy' => $hoy->toDateString(),
            'presupuesto' => [
                'limite' => $limite,
                'fecha_inicio' => $inicio,
                'fecha_pago' => $pago,
                'gastado' => $gastado,
                'restante' => $comparacion < 0 ? bcsub($limite, $gastado, 2) : '0.00',
                'excedido' => $comparacion > 0 ? bcsub($gastado, $limite, 2) : '0.00',
                'estado' => match (true) {
                    $gastado === '0.00' => 'sin_gastos',
                    $comparacion < 0 => 'disponible',
                    $comparacion === 0 => 'al_limite',
                    default => 'excedido',
                },
                'terminado' => $pago <= $hoy->toDateString(),
            ],
        ]);
    }
}
