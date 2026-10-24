<?php

namespace App\Http\Controllers;

use App\Http\Requests\DashboardAnioRequest;
use App\Http\Requests\DashboardMesRequest;
use App\Http\Requests\GuardarMetaAhorroRequest;
use App\Models\MetaAhorro;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function resumen(DashboardMesRequest $request): JsonResponse
    {
        $anio = $request->integer('anio');
        $mes = $request->integer('mes');
        $inicioAnio = CarbonImmutable::create($anio, 1, 1)->toDateString();
        $inicioMes = CarbonImmutable::create($anio, $mes, 1)->toDateString();
        $finMes = CarbonImmutable::create($anio, $mes, 1)->endOfMonth()->toDateString();

        $totales = DB::query()
            ->fromSub($this->movimientos($request->user()->id, $inicioAnio, $finMes), 'movimientos')
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

        return response()->json([
            'ingresos_mes' => $ingresosMes,
            'egresos_mes' => $egresosMes,
            'balance_mes' => bcsub($ingresosMes, $egresosMes, 2),
            'ingresos_acumulados' => $ingresosAcumulados,
            'egresos_acumulados' => $egresosAcumulados,
            'balance_acumulado' => bcsub($ingresosAcumulados, $egresosAcumulados, 2),
            'porcentaje_gastado' => $this->porcentaje($egresosMes, $ingresosMes),
        ]);
    }

    public function egresosPorCategoria(DashboardMesRequest $request): JsonResponse
    {
        $inicioMes = CarbonImmutable::create(
            $request->integer('anio'),
            $request->integer('mes'),
            1,
        );

        $categorias = $request->user()
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
            ]);

        return response()->json($categorias);
    }

    public function resumenAnual(DashboardAnioRequest $request): JsonResponse
    {
        $anio = $request->integer('anio');
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

        $resumen = collect(range(1, 12))->map(function (int $mes) use ($totalesPorMes) {
            $totales = $totalesPorMes->get($mes);
            $ingresos = $this->monto($totales->ingresos ?? 0);
            $egresos = $this->monto($totales->egresos ?? 0);

            return [
                'mes' => $mes,
                'ingresos' => $ingresos,
                'egresos' => $egresos,
                'balance' => bcsub($ingresos, $egresos, 2),
            ];
        });

        return response()->json($resumen);
    }

    public function metaAhorro(DashboardMesRequest $request): JsonResponse
    {
        $anio = $request->integer('anio');
        $mes = $request->integer('mes');
        $meta = $request->user()->metasAhorro()
            ->where('anio', $anio)
            ->where('mes', $mes)
            ->first();

        return response()->json($this->metaAhorroPayload($meta, $request->user(), $anio, $mes));
    }

    public function guardarMetaAhorro(GuardarMetaAhorroRequest $request): JsonResponse
    {
        $datos = $request->validated();
        $meta = $request->user()->metasAhorro()->updateOrCreate(
            [
                'anio' => $datos['anio'],
                'mes' => $datos['mes'],
            ],
            [
                'monto_objetivo' => $datos['monto_objetivo'],
            ],
        );

        return response()->json($this->metaAhorroPayload(
            $meta,
            $request->user(),
            (int) $datos['anio'],
            (int) $datos['mes'],
        ));
    }

    public function eliminarMetaAhorro(DashboardMesRequest $request): Response
    {
        $request->user()->metasAhorro()
            ->where('anio', $request->integer('anio'))
            ->where('mes', $request->integer('mes'))
            ->delete();

        return response()->noContent();
    }

    /** @return array{meta: array{id: int, anio: int, mes: int, monto_objetivo: string}|null, ingresos_acumulados: string, porcentaje_progreso: string, faltante: string} */
    private function metaAhorroPayload(?MetaAhorro $meta, User $user, int $anio, int $mes): array
    {
        $ingresosAcumulados = $this->ingresosAcumulados($user->id, $anio, $mes);

        if (! $meta) {
            return [
                'meta' => null,
                'ingresos_acumulados' => $ingresosAcumulados,
                'porcentaje_progreso' => '0.00',
                'faltante' => '0.00',
            ];
        }

        $objetivo = $this->monto($meta->monto_objetivo);
        $progreso = bcdiv(bcmul($ingresosAcumulados, '100', 4), $objetivo, 3);
        $progreso = min(100, max(0, round((float) $progreso, 2)));
        $faltante = bccomp($ingresosAcumulados, $objetivo, 2) >= 0
            ? '0.00'
            : bcsub($objetivo, $ingresosAcumulados, 2);

        return [
            'meta' => [
                'id' => $meta->id,
                'anio' => $meta->anio,
                'mes' => $meta->mes,
                'monto_objetivo' => $objetivo,
            ],
            'ingresos_acumulados' => $ingresosAcumulados,
            'porcentaje_progreso' => number_format($progreso, 2, '.', ''),
            'faltante' => $faltante,
        ];
    }

    private function ingresosAcumulados(int $userId, int $anio, int $mes): string
    {
        $inicioAnio = CarbonImmutable::create($anio, 1, 1)->toDateString();
        $finMes = CarbonImmutable::create($anio, $mes, 1)->endOfMonth()->toDateString();
        $total = DB::table('ingresos')
            ->where('user_id', $userId)
            ->whereBetween('fecha', [$inicioAnio, $finMes])
            ->sum('monto');

        return $this->monto($total);
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
