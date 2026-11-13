<?php

namespace App\Http\Controllers;

use App\Models\PagoProgramado;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class DatosSincronizadosController extends Controller
{
    public function efectivo(Request $request): JsonResponse
    {
        return response()->json(['monto' => $request->user()->efectivo]);
    }

    public function guardarEfectivo(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'monto' => ['required', 'numeric', 'decimal:0,2', 'between:0,9999999999.99'],
            'importar' => ['sometimes', 'boolean'],
        ]);
        $usuario = $request->user();
        $query = User::query()->whereKey($usuario->id);
        if ($request->boolean('importar')) {
            $query->whereNull('efectivo');
        }
        $query->update(['efectivo' => $datos['monto']]);

        return response()->json(['monto' => $usuario->refresh()->efectivo]);
    }

    public function pagos(Request $request): JsonResponse
    {
        return response()->json($request->user()->pagosProgramados()->get()->map->datos());
    }

    public function guardarPago(Request $request, string $clave): JsonResponse
    {
        $datos = $request->validate($this->reglas());
        $pago = DB::transaction(function () use ($request, $clave, $datos): PagoProgramado {
            $usuario = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $pago = $usuario->pagosProgramados()->withTrashed()->firstOrNew(['clave' => $clave]);
            abort_if($pago->trashed(), 404, 'Este pago se eliminó en otro dispositivo.');
            $pago->configuracion = $this->configuracion($datos);
            $pago->fechas_pagadas ??= [];
            $pago->save();

            return $pago;
        });

        return response()->json($pago->datos());
    }

    public function importarPagos(Request $request): JsonResponse
    {
        $reglas = [
            'pagos' => ['required', 'array', 'max:100'],
            'pagos.*.id' => ['required', 'distinct', 'string', 'max:80', 'regex:/\A[a-zA-Z0-9-]+\z/'],
            'pagos.*.paidDates' => ['sometimes', 'array'],
            'pagos.*.paidDates.*' => ['required', 'date_format:Y-m-d'],
        ];
        foreach ($this->reglas() as $campo => $validacion) {
            $reglas['pagos.*.'.$campo] = $validacion;
        }
        $datos = $request->validate($reglas);
        DB::transaction(function () use ($request, $datos): void {
            $usuario = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            foreach ($datos['pagos'] as $pago) {
                $usuario->pagosProgramados()->withTrashed()->firstOrCreate(['clave' => $pago['id']], [
                    'configuracion' => $this->configuracion($pago),
                    'fechas_pagadas' => array_values(array_unique($pago['paidDates'] ?? [])),
                ]);
            }
        });

        return $this->pagos($request);
    }

    public function eliminarPago(Request $request, string $clave): Response
    {
        DB::transaction(function () use ($request, $clave): void {
            $pago = $request->user()->pagosProgramados()->where('clave', $clave)->lockForUpdate()->firstOrFail();
            $pago->delete();
        });

        return response()->noContent();
    }

    private function reglas(): array
    {
        return [
            'name' => ['required', 'string', 'max:70'],
            'kind' => ['required', 'in:subscription,bill'],
            'amount' => ['nullable', 'numeric', 'decimal:0,2', 'gt:0', 'max:9999999999.99'],
            'frequency' => ['required', 'in:monthly,twice-monthly'],
            'days' => ['required', 'array', 'min:1', 'max:2'],
            'days.*' => ['required', 'integer', 'between:1,31'],
            'cardType' => ['required', 'in:none,credit,debit'],
            'cardName' => ['nullable', 'string', 'max:32', 'not_regex:/\d(?:[ -]*\d){12}/'],
            'cutDay' => ['nullable', 'integer', 'between:1,31'],
        ];
    }

    private function configuracion(array $datos): array
    {
        $configuracion = Arr::except($datos, ['id', 'paidDates']);
        $dias = array_values(array_unique(array_map('intval', $datos['days'])));
        sort($dias);
        if (($datos['frequency'] === 'monthly' && count($dias) !== 1) ||
            ($datos['frequency'] === 'twice-monthly' && (count($dias) !== 2 || $dias[0] > 15 || $dias[1] < 16))) {
            throw \Illuminate\Validation\ValidationException::withMessages(['days' => 'Elige los días de pago según la frecuencia.']);
        }

        return [
            ...$configuracion,
            'days' => $dias,
            'amount' => isset($datos['amount']) ? bcadd((string) $datos['amount'], '0', 2) : '',
            'cardName' => $datos['cardType'] === 'none' ? '' : ($datos['cardName'] ?? ''),
            'cutDay' => $datos['cardType'] === 'credit' ? ($datos['cutDay'] ?? '') : '',
        ];
    }
}
