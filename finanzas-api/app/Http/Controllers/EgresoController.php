<?php

namespace App\Http\Controllers;

use App\Http\Requests\EgresoRequest;
use App\Http\Requests\IndexEgresoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EgresoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexEgresoRequest $request): JsonResponse
    {
        $egresos = $request->user()
            ->egresos()
            ->with(['categoria', 'subcategoria'])
            ->when(
                $request->filled(['anio', 'mes']),
                fn ($query) => $query->delMes(
                    $request->integer('anio'),
                    $request->integer('mes'),
                ),
            )
            ->when(
                $request->filled(['desde', 'hasta']),
                fn ($query) => $query->whereBetween('fecha', [$request->validated('desde'), $request->validated('hasta')]),
            )
            ->orderByDesc('fecha')
            ->get();

        return response()->json($egresos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EgresoRequest $request): JsonResponse
    {
        $egreso = $request->user()->egresos()->create($request->validated());

        return response()->json($egreso->load(['categoria', 'subcategoria']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(IndexEgresoRequest $request, int $egreso): JsonResponse
    {
        $egresoEncontrado = $request->user()
            ->egresos()
            ->with(['categoria', 'subcategoria'])
            ->findOrFail($egreso);

        return response()->json($egresoEncontrado);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EgresoRequest $request, int $egreso): JsonResponse
    {
        $egresoEncontrado = DB::transaction(function () use ($request, $egreso) {
            $compra = $request->user()->egresos()->lockForUpdate()->findOrFail($egreso);
            $datos = $request->validated();
            $devuelto = (string) $compra->devoluciones()->sum('monto');
            if (bccomp((string) $datos['monto'], $devuelto, 2) < 0) {
                throw ValidationException::withMessages(['monto' => 'El gasto no puede ser menor que lo devuelto.']);
            }
            if ($compra->devoluciones()->where('fecha', '<', $datos['fecha'])->exists()) {
                throw ValidationException::withMessages(['fecha' => 'La fecha del gasto no puede ser posterior a sus devoluciones.']);
            }
            $compra->update($datos);

            return $compra;
        });

        return response()->json($egresoEncontrado->load(['categoria', 'subcategoria']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IndexEgresoRequest $request, int $egreso): Response
    {
        DB::transaction(function () use ($request, $egreso): void {
            $compra = $request->user()->egresos()->lockForUpdate()->findOrFail($egreso);
            if ($compra->devoluciones()->exists()) {
                throw ValidationException::withMessages(['egreso' => 'Quita las devoluciones vinculadas antes de eliminar el gasto.']);
            }
            $compra->delete();
        });

        return response()->noContent();
    }
}
