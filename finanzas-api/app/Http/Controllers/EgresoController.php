<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RespondsWithPagination;
use App\Http\Requests\EgresoRequest;
use App\Http\Requests\IndexEgresoRequest;
use App\Support\DashboardCache;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class EgresoController extends Controller
{
    use RespondsWithPagination;

    public function __construct(private readonly DashboardCache $dashboardCache) {}

    /**
     * Display a listing of the resource.
     */
    public function index(IndexEgresoRequest $request): JsonResponse
    {
        [$desde, $hasta] = $this->rango($request);

        $query = $request->user()
            ->egresos()
            ->with(['categoria', 'subcategoria']);

        if ($desde !== null) {
            $query->entreFechas($desde, $hasta);
        }

        $egresos = $query
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return $this->paginatedJson($egresos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EgresoRequest $request): JsonResponse
    {
        $egreso = $request->user()->egresos()->create($request->validated());
        $this->dashboardCache->invalidate($request->user()->getKey());

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
        $this->dashboardCache->invalidate($request->user()->getKey());

        return response()->json($egresoEncontrado->load(['categoria', 'subcategoria']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IndexEgresoRequest $request, int $egreso): Response
    {
        $request->user()->egresos()->findOrFail($egreso)->delete();
        $this->dashboardCache->invalidate($request->user()->getKey());

        return response()->noContent();
    }

    /** @return array{string|null, string|null} */
    private function rango(IndexEgresoRequest $request): array
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
