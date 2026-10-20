<?php

namespace App\Http\Controllers;

use App\Http\Requests\DashboardAnioRequest;
use App\Http\Requests\DashboardMesRequest;
use App\Support\DashboardCache;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardCache $dashboardCache) {}

    public function resumen(DashboardMesRequest $request): JsonResponse
    {
        $anio = $request->integer('anio');
        $mes = $request->integer('mes');
        $userId = $request->user()->getKey();

        $resumen = $this->dashboardCache->remember($userId, 'resumen', [$anio, $mes], function () use ($userId, $anio, $mes) {
            $inicioAnio = CarbonImmutable::create($anio, 1, 1)->toDateString();
            $inicioMes = CarbonImmutable::create($anio, $mes, 1)->toDateString();
            $finMes = CarbonImmutable::create($anio, $mes, 1)->endOfMonth()->toDateString();

            $totales = DB::query()
                ->fromSub($this->movimientos($userId, $inicioAnio, $finMes), 'movimientos')
                ->selectRaw(
                    <<<'SQL'
                    COALESCE(SUM(CASE WHEN tipo = 'ingreso' AND fecha >= ? THEN monto ELSE 0 END), 0) AS ingresos_mes,
                    COALESCE(SUM(CASE WHEN tipo = 'egreso' AND fecha >= ? THEN monto ELSE 0 END), 0) AS egresos_mes,
                    COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS ingresos_acumulados,
                    COALESCE(SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END), 0) AS egresos_acumulados
                    SQL,
                    [$inicioMes, $inicioMes],
                )
                ->first();

            $ingresosMes = $this->monto($totales->ingresos_mes);
            $egresosMes = $this->monto($totales->egresos_mes);
            $ingresosAcumulados = $this->monto($totales->ingresos_acumulados);
            $egresosAcumulados = $this->monto($totales->egresos_acumulados);

            return [
                'ingresos_mes' => $ingresosMes,
                'egresos_mes' => $egresosMes,
                'balance_mes' => bcsub($ingresosMes, $egresosMes, 2),
                'ingresos_acumulados' => $ingresosAcumulados,
                'egresos_acumulados' => $egresosAcumulados,
                'balance_acumulado' => bcsub($ingresosAcumulados, $egresosAcumulados, 2),
                'porcentaje_gastado' => $this->porcentaje($egresosMes, $ingresosMes),
            ];
        });

        return response()->json($resumen);
    }

    public function egresosPorCategoria(DashboardMesRequest $request): JsonResponse
    {
        $anio = $request->integer('anio');
        $mes = $request->integer('mes');
        $userId = $request->user()->getKey();

        $categorias = $this->dashboardCache->remember($userId, 'egresos-por-categoria', [$anio, $mes], function () use ($request, $anio, $mes) {
            $inicioMes = CarbonImmutable::create($anio, $mes, 1);

            return $request->user()
                ->egresos()
                ->join('categorias', 'categorias.id', '=', 'egresos.categoria_id')
                ->whereBetween('egresos.fecha', [
                    $inicioMes->toDateString(),
                    $inicioMes->endOfMonth()->toDateString(),
                ])
                ->select('categorias.id as categoria_id', 'categorias.nombre')
                ->selectRaw('SUM(egresos.monto) as total')
                ->groupBy('categorias.id', 'categorias.nombre')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($categoria) => [
                    'categoria_id' => $categoria->categoria_id,
                    'nombre' => $categoria->nombre,
                    'total' => $this->monto($categoria->total),
                ])
                ->all();
        });

        return response()->json($categorias);
    }

    public function resumenAnual(DashboardAnioRequest $request): JsonResponse
    {
        $anio = $request->integer('anio');
        $userId = $request->user()->getKey();

        $resumen = $this->dashboardCache->remember($userId, 'resumen-anual', [$anio], function () use ($request, $anio) {
            $inicioAnio = CarbonImmutable::create($anio, 1, 1);

            $totalesPorMes = DB::query()
                ->fromSub(
                    $this->movimientos(
                        $request->user()->id,
                        $inicioAnio->toDateString(),
                        $inicioAnio->endOfYear()->toDateString(),
                    ),
                    'movimientos',
                )
                ->selectRaw(
                    <<<'SQL'
                    MONTH(fecha) AS mes,
                    COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS ingresos,
                    COALESCE(SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END), 0) AS egresos
                    SQL,
                )
                ->groupByRaw('MONTH(fecha)')
                ->get()
                ->keyBy('mes');

            return collect(range(1, 12))->map(function (int $mes) use ($totalesPorMes) {
                $totales = $totalesPorMes->get($mes);
                $ingresos = $this->monto($totales->ingresos ?? 0);
                $egresos = $this->monto($totales->egresos ?? 0);

                return [
                    'mes' => $mes,
                    'ingresos' => $ingresos,
                    'egresos' => $egresos,
                    'balance' => bcsub($ingresos, $egresos, 2),
                ];
            })->all();
        });

        return response()->json($resumen);
    }

    private function movimientos(int $userId, string $desde, string $hasta): Builder
    {
        $ingresos = DB::table('ingresos')
            ->selectRaw("'ingreso' AS tipo, fecha, monto")
            ->where('user_id', $userId)
            ->whereBetween('fecha', [$desde, $hasta]);

        return DB::table('egresos')
            ->selectRaw("'egreso' AS tipo, fecha, monto")
            ->where('user_id', $userId)
            ->whereBetween('fecha', [$desde, $hasta])
            ->unionAll($ingresos);
    }

    private function monto(int|string $monto): string
    {
        return bcadd((string) $monto, '0', 2);
    }

    private function porcentaje(string $egresos, string $ingresos): string
    {
        if (bccomp($ingresos, '0', 2) === 0) {
            return '0.00';
        }

        $resultado = bcdiv(bcmul($egresos, '100', 4), $ingresos, 3);

        return number_format(round((float) $resultado, 2), 2, '.', '');
    }
}
