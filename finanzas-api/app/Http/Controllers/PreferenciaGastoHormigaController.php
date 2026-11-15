<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PreferenciaGastoHormigaController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $userId = $request->user()->getKey();
        $preferencia = DB::table('preferencias_gasto_hormiga')->where('user_id', $userId)->first();
        $categoriaId = $preferencia?->categoria_id ? (int) $preferencia->categoria_id : null;

        return $this->resolverRespuesta($categoriaId, $userId);
    }

    public function update(Request $request): JsonResponse
    {
        $userId = $request->user()->getKey();
        $datos = $request->validate([
            'categoria_id' => [
                'present',
                'nullable',
                'integer',
                Rule::exists('categorias', 'id')->where(
                    fn (Builder $query) => $query
                        ->where('tipo', 'egreso')
                        ->where(fn (Builder $query) => $query
                            ->whereNull('user_id')
                            ->orWhere('user_id', $userId))
                ),
            ],
        ]);

        $categoriaId = $datos['categoria_id'] !== null ? (int) $datos['categoria_id'] : null;

        if ($categoriaId === null) {
            DB::table('preferencias_gasto_hormiga')->where('user_id', $userId)->delete();
        } else {
            DB::table('preferencias_gasto_hormiga')->upsert(
                [
                    'user_id' => $userId,
                    'categoria_id' => $categoriaId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                ['user_id'],
                ['categoria_id', 'updated_at']
            );
        }

        return $this->resolverRespuesta($categoriaId, $userId);
    }

    private function resolverRespuesta(?int $categoriaId, int $userId): JsonResponse
    {
        $categoriaElegida = null;

        if ($categoriaId !== null) {
            $categoriaElegida = Categoria::query()
                ->where('id', $categoriaId)
                ->where('tipo', 'egreso')
                ->where(fn ($query) => $query
                    ->whereNull('user_id')
                    ->orWhere('user_id', $userId))
                ->first();
        }

        if ($categoriaElegida) {
            return response()->json([
                'categoria_id' => (int) $categoriaElegida->id,
                'categoria_efectiva' => [
                    'id' => (int) $categoriaElegida->id,
                    'nombre' => $categoriaElegida->nombre,
                ],
            ]);
        }

        $fallback = Categoria::query()
            ->whereNull('user_id')
            ->where('tipo', 'egreso')
            ->where('nombre', 'Otro Egreso')
            ->first();

        return response()->json([
            'categoria_id' => null,
            'categoria_efectiva' => $fallback ? [
                'id' => (int) $fallback->id,
                'nombre' => $fallback->nombre,
            ] : null,
        ]);
    }
}
