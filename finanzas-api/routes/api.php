<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EgresoController;
use App\Http\Controllers\IngresoController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::prefix('dashboard')->group(function () {
        Route::get('/resumen', [DashboardController::class, 'resumen']);
        Route::get('/egresos-por-categoria', [DashboardController::class, 'egresosPorCategoria']);
        Route::get('/resumen-anual', [DashboardController::class, 'resumenAnual']);
        Route::get('/meta-ahorro', [DashboardController::class, 'metaAhorro']);
        Route::put('/meta-ahorro', [DashboardController::class, 'guardarMetaAhorro']);
        Route::delete('/meta-ahorro', [DashboardController::class, 'eliminarMetaAhorro']);
    });
    Route::apiResource('egresos', EgresoController::class);
    Route::apiResource('ingresos', IngresoController::class);
    Route::apiResource('categorias', CategoriaController::class);
});
