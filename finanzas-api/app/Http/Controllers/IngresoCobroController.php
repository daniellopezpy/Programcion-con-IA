<?php

namespace App\Http\Controllers;

use App\Http\Requests\IngresoCobroRequest;
use App\Support\IngresosDeCobros;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class IngresoCobroController extends Controller
{
    public function store(IngresoCobroRequest $request, IngresosDeCobros $ingresos): JsonResponse
    {
        $datos = $request->validated();
        $ingreso = $ingresos->registrar($request->user(), $request->claveDelCobro(), $datos['fuente'], $datos['monto']);

        return response()->json($ingreso->load('categoria'), $ingreso->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(IngresoCobroRequest $request): Response
    {
        $request->user()->ingresos()
            ->where('cobro_clave', $request->claveDelCobro())
            ->delete();

        return response()->noContent();
    }
}
