<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexIngresoRequest;
use App\Http\Requests\IngresoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class IngresoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexIngresoRequest $request): JsonResponse
    {
        $ingresos = $request->user()
            ->ingresos()
            ->with('categoria')
            ->when(
                $request->filled(['anio', 'mes']),
                fn ($query) => $query->delMes(
                    $request->integer('anio'),
                    $request->integer('mes'),
                ),
            )
            ->orderByDesc('fecha')
            ->get();

        return response()->json($ingresos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(IngresoRequest $request): JsonResponse
    {
        $ingreso = $request->user()->ingresos()->create($request->validated());

        return response()->json($ingreso->load('categoria'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(IndexIngresoRequest $request, int $ingreso): JsonResponse
    {
        $ingresoEncontrado = $request->user()
            ->ingresos()
            ->with('categoria')
            ->findOrFail($ingreso);

        return response()->json($ingresoEncontrado);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(IngresoRequest $request, int $ingreso): JsonResponse
    {
        $ingresoEncontrado = $request->user()->ingresos()->findOrFail($ingreso);
        $ingresoEncontrado->update($request->validated());

        return response()->json($ingresoEncontrado->load('categoria'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IndexIngresoRequest $request, int $ingreso): Response
    {
        $request->user()->ingresos()->findOrFail($ingreso)->delete();

        return response()->noContent();
    }
}
