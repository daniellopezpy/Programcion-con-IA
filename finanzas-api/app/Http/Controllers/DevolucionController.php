<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Egreso;
use App\Models\Ingreso;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DevolucionController extends Controller
{
    public function index(Request $request, int $egreso): JsonResponse
    {
        $compra = $request->user()->egresos()->findOrFail($egreso);

        return response()->json([
            'devoluciones' => $compra->devoluciones()->orderByDesc('fecha')->orderByDesc('id')->get(['id', 'fecha', 'monto']),
            'restante' => $this->restante($compra),
        ]);
    }

    public function store(Request $request, int $egreso): JsonResponse
    {
        $datos = $request->validate([
            'monto' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:9999999999.99'],
            'fecha' => ['required', 'date_format:Y-m-d', 'before_or_equal:'.CarbonImmutable::today('America/Guatemala')->toDateString()],
            'operacion' => ['required', 'uuid'],
        ]);

        $ingreso = DB::transaction(function () use ($request, $egreso, $datos): Ingreso {
            $usuario = $request->user();
            $compra = $usuario->egresos()->lockForUpdate()->findOrFail($egreso);
            $existente = $compra->devoluciones()->where('devolucion_operacion', $datos['operacion'])->first();
            if ($existente) {
                return $existente;
            }

            if ($datos['fecha'] < $compra->fecha->toDateString()) {
                throw ValidationException::withMessages(['fecha' => 'La devolución debe ser del día de la compra o después.']);
            }
            if (bccomp((string) $datos['monto'], $this->restante($compra), 2) > 0) {
                throw ValidationException::withMessages(['monto' => 'El monto supera lo pendiente de devolver.']);
            }

            $categoria = Categoria::query()->whereNull('user_id')->where('tipo', 'ingreso')->where('nombre', 'Otro Ingreso')->value('id');
            if ($categoria === null) {
                throw ValidationException::withMessages(['categoria_id' => 'Falta la categoría Otro ingreso para registrar la devolución.']);
            }

            return $usuario->ingresos()->create([
                'categoria_id' => $categoria,
                'fecha' => $datos['fecha'],
                'fuente' => mb_substr('Devolución de '.$compra->descripcion, 0, 150),
                'monto' => $datos['monto'],
                'egreso_devolucion_id' => $compra->id,
                'devolucion_operacion' => $datos['operacion'],
            ]);
        });

        return response()->json($ingreso->load('categoria'), $ingreso->wasRecentlyCreated ? 201 : 200);
    }

    private function restante(Egreso $compra): string
    {
        return bcsub($compra->monto, (string) $compra->devoluciones()->sum('monto'), 2);
    }
}
