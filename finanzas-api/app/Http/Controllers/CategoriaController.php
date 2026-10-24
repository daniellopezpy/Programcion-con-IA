<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoriaRequest;
use App\Http\Requests\IndexCategoriaRequest;
use App\Models\Categoria;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CategoriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexCategoriaRequest $request): JsonResponse
    {
        $categorias = Categoria::query()
            ->where(fn ($query) => $query
                ->whereNull('user_id')
                ->orWhere('user_id', $request->user()->getKey()))
            ->with('subcategorias')
            ->when(
                $request->filled('tipo'),
                fn ($query) => $query->where('tipo', (string) $request->string('tipo')),
            )
            ->orderBy('nombre')
            ->get();

        return response()->json($categorias);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CategoriaRequest $request): JsonResponse
    {
        $categoria = $request->user()->categorias()->create($request->validated());

        return response()->json($categoria, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(IndexCategoriaRequest $request, int $categoria): JsonResponse
    {
        $categoriaEncontrada = Categoria::query()
            ->where(fn ($query) => $query
                ->whereNull('user_id')
                ->orWhere('user_id', $request->user()->getKey()))
            ->with('subcategorias')
            ->findOrFail($categoria);

        return response()->json($categoriaEncontrada);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CategoriaRequest $request, int $categoria): JsonResponse
    {
        $categoriaEncontrada = $request->user()->categorias()->findOrFail($categoria);
        $categoriaEncontrada->update($request->validated());

        return response()->json($categoriaEncontrada);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IndexCategoriaRequest $request, int $categoria): Response|JsonResponse
    {
        $categoriaEncontrada = $request->user()->categorias()->findOrFail($categoria);

        try {
            $categoriaEncontrada->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'La categoría no puede eliminarse porque está en uso.',
            ], 409);
        }

        return response()->noContent();
    }
}
