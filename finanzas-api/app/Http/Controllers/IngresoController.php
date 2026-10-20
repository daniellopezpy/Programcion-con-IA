<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RespondsWithPagination;
use App\Http\Requests\IndexIngresoRequest;
use App\Http\Requests\IngresoRequest;
use App\Support\DashboardCache;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class IngresoController extends Controller
{
    use RespondsWithPagination;

    public function __construct(private readonly DashboardCache $dashboardCache) {}

    /**
     * Display a listing of the resource.
     */
    public function index(IndexIngresoRequest $request): JsonResponse
    {
        [$desde, $hasta] = $this->rango($request);

        $query = $request->user()
            ->ingresos()
            ->with('categoria');

        if ($desde !== null) {
            $query->entreFechas($desde, $hasta);
        }

        $ingresos = $query
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return $this->paginatedJson($ingresos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(IngresoRequest $request): JsonResponse
    {
        $ingreso = $request->user()->ingresos()->create($request->validated());
        $this->dashboardCache->invalidate($request->user()->getKey());

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
        $this->dashboardCache->invalidate($request->user()->getKey());

        return response()->json($ingresoEncontrado->load('categoria'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IndexIngresoRequest $request, int $ingreso): Response
    {
        $request->user()->ingresos()->findOrFail($ingreso)->delete();
        $this->dashboardCache->invalidate($request->user()->getKey());

        return response()->noContent();
    }

    /** @return array{string|null, string|null} */
    private function rango(IndexIngresoRequest $request): array
    {
        if ($request->filled('desde')) {
            return [
                (string) $request->string('desde'),
                (string) $request->string('hasta'),
            ];
        }

        if (! $request->filled('anio')) {
            return [null, null];
        }

        $inicio = CarbonImmutable::create($request->integer('anio'), $request->integer('mes'), 1);

        return [$inicio->toDateString(), $inicio->endOfMonth()->toDateString()];
    }
}
