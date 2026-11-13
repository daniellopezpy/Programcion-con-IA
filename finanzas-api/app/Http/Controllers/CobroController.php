<?php

namespace App\Http\Controllers;

use App\Http\Requests\CobroRequest;
use App\Models\Cobro;
use App\Models\Ingreso;
use App\Models\User;
use App\Support\IngresosDeCobros;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CobroController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cobros = $request->user()->cobros()->latest('id')->get()
            ->map(fn (Cobro $cobro) => $cobro->paraApi());

        return response()->json($cobros);
    }

    public function store(CobroRequest $request): JsonResponse
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $datos) {
            $usuario = User::query()->lockForUpdate()->findOrFail($request->user()->getKey());
            $cobro = $this->crearSiNoExiste($usuario, $datos);
            abort_if($cobro->trashed(), 404);

            return response()->json($cobro->paraApi(), $cobro->wasRecentlyCreated ? 201 : 200);
        }, 3);
    }

    public function update(CobroRequest $request): JsonResponse
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $datos) {
            $cobro = $this->bloquearCobro($request);

            if ($cobro->ingreso_id !== null) {
                $errores = [];
                if (isset($datos['person']) && $datos['person'] !== $cobro->persona) {
                    $errores['person'] = 'Devuelve el cobro a pendientes para cambiar el nombre.';
                }
                if (isset($datos['amount']) && bccomp((string) $datos['amount'], $cobro->monto, 2) !== 0) {
                    $errores['amount'] = 'Devuelve el cobro a pendientes para cambiar el monto.';
                }
                if ($errores !== []) {
                    throw ValidationException::withMessages($errores);
                }
            }

            $cobro->update($this->camposEditables($datos));

            return response()->json($cobro->paraApi());
        }, 3);
    }

    public function destroy(CobroRequest $request): Response
    {
        DB::transaction(function () use ($request) {
            $cobro = $request->user()->cobros()->withTrashed()
                ->where('clave', IngresosDeCobros::clave($request->validated('id')))
                ->lockForUpdate()
                ->firstOrFail();

            if (! $cobro->trashed()) {
                $cobro->delete();
            }
        }, 3);

        return response()->noContent();
    }

    public function recibir(CobroRequest $request, IngresosDeCobros $ingresos): JsonResponse
    {
        return DB::transaction(function () use ($request, $ingresos) {
            $cobro = $this->bloquearCobro($request);

            if ($cobro->fecha_recibido === null) {
                $ingreso = $ingresos->registrar($request->user(), $cobro->clave, 'Cobro de '.$cobro->persona, $cobro->monto);
                $cobro->update([
                    'monto' => $ingreso->monto,
                    'fecha_recibido' => $ingreso->fecha,
                    'ingreso_id' => $ingreso->id,
                ]);
            }

            return response()->json($cobro->paraApi());
        }, 3);
    }

    public function devolverAPendientes(CobroRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $cobro = $this->bloquearCobro($request);

            if ($cobro->ingreso_id !== null) {
                $request->user()->ingresos()
                    ->whereKey($cobro->ingreso_id)
                    ->where('cobro_clave', $cobro->clave)
                    ->delete();
            }

            $cobro->update(['fecha_recibido' => null, 'ingreso_id' => null]);

            return response()->json($cobro->paraApi());
        }, 3);
    }

    public function importar(CobroRequest $request): Response
    {
        $registros = $request->validated('items');

        DB::transaction(function () use ($request, $registros) {
            // La creación directa y la importación deben decidir en el mismo orden si un ID ya existe.
            $usuario = User::query()->lockForUpdate()->findOrFail($request->user()->getKey());
            $claves = array_map(fn (array $registro) => IngresosDeCobros::clave($registro['id']), $registros);
            $ingresos = $usuario->ingresos()->whereIn('cobro_clave', $claves)->get()->keyBy('cobro_clave');

            foreach ($registros as $indice => $datos) {
                $this->crearSiNoExiste($usuario, $datos, $ingresos->get($claves[$indice]));
            }
        }, 3);

        return response()->noContent();
    }

    private function bloquearCobro(CobroRequest $request): Cobro
    {
        return $request->user()->cobros()
            ->where('clave', IngresosDeCobros::clave($request->validated('id')))
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function crearSiNoExiste(User $usuario, array $datos, ?Ingreso $ingreso = null): Cobro
    {
        return $usuario->cobros()->withTrashed()->firstOrCreate(
            ['clave' => IngresosDeCobros::clave($datos['id'])],
            [
                'identificador' => $datos['id'],
                ...$this->camposEditables($datos),
                'monto' => $ingreso?->monto ?? $datos['amount'],
                'fecha_recibido' => $ingreso?->fecha ?? ($datos['collectedDate'] ?? null),
                'ingreso_id' => $ingreso?->id,
            ],
        );
    }

    private function camposEditables(array $datos): array
    {
        $campos = [];
        foreach (['person' => 'persona', 'amount' => 'monto', 'dueDate' => 'fecha_vencimiento', 'note' => 'nota'] as $campo => $columna) {
            if (array_key_exists($campo, $datos)) {
                $campos[$columna] = $datos[$campo];
            }
        }

        return $campos;
    }
}
