<?php

namespace App\Http\Controllers;

use App\Http\Requests\EgresoRequest;
use App\Http\Requests\IndexEgresoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

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
        $egresoEncontrado = $request->user()->egresos()->findOrFail($egreso);
        $egresoEncontrado->update($request->validated());

        return response()->json($egresoEncontrado->load(['categoria', 'subcategoria']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IndexEgresoRequest $request, int $egreso): Response
    {
        $request->user()->egresos()->findOrFail($egreso)->delete();

        return response()->noContent();
    }
}
