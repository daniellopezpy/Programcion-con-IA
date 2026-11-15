<?php

namespace App\Http\Controllers;

use App\Http\Requests\EgresoRecurrenteRequest;
use App\Models\Categoria;
use App\Models\Egreso;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EgresoRecurrenteController extends Controller
{
    public function store(EgresoRecurrenteRequest $request): JsonResponse
    {
        $datos = $request->validated();

        $egreso = DB::transaction(function () use ($request, $datos): Egreso {
            $usuario = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $pago = $usuario->pagosProgramados()->withTrashed()->where('clave', $datos['pago'])->lockForUpdate()->first();
            abort_if($pago?->trashed(), 404, 'Este pago se eliminó en otro dispositivo.');
            if ($pago && !in_array($datos['vencimiento'], $pago->fechas_pagadas ?? [], true)) {
                if (!$pago->esVencimientoValido($datos['vencimiento'])) {
                    throw ValidationException::withMessages(['vencimiento' => 'Este vencimiento cambió. Revisa el calendario.']);
                }
            }

            $egreso = $this->registrarEgreso($usuario, $request->claveDelVencimiento(), $datos);
            $pago?->cambiarFechaPagada($datos['vencimiento'], true);

            return $egreso;
        });

        return response()->json($egreso->load(['categoria', 'subcategoria']), $egreso->wasRecentlyCreated ? 201 : 200);
    }

    private function registrarEgreso(User $usuario, string $clave, array $datos): Egreso
    {
        return $usuario->egresos()->firstOrCreate(
            ['pago_recurrente_clave' => $clave],
            function () use ($datos): array {
                $categoriaId = Categoria::query()
                    ->whereNull('user_id')
                    ->where('tipo', 'egreso')
                    ->where('nombre', 'Otro Egreso')
                    ->value('id');

                if ($categoriaId === null) {
                    throw ValidationException::withMessages([
                        'categoria_id' => 'Falta la categoría Otro egreso. No se registró el gasto.',
                    ]);
                }

                return [
                    'categoria_id' => $categoriaId,
                    'fecha' => CarbonImmutable::today('America/Guatemala')->toDateString(),
                    'descripcion' => $datos['descripcion'],
                    'monto' => $datos['monto'],
                ];
            },
        );
    }

    public function destroy(EgresoRecurrenteRequest $request): Response
    {
        DB::transaction(function () use ($request): void {
            $usuario = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $pago = $usuario->pagosProgramados()->withTrashed()->where('clave', $request->validated('pago'))->lockForUpdate()->first();
            $egreso = $usuario->egresos()
                ->where('pago_recurrente_clave', $request->claveDelVencimiento())
                ->lockForUpdate()
                ->first();
            if ($egreso?->devoluciones()->exists()) {
                throw ValidationException::withMessages(['egreso' => 'Quita las devoluciones vinculadas antes de deshacer el pago.']);
            }
            $egreso?->delete();
            $pago?->cambiarFechaPagada($request->validated('vencimiento'), false);
        });

        return response()->noContent();
    }
}
