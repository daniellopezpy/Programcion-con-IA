<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\CobroController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DatosSincronizadosController;
use App\Http\Controllers\DevolucionController;
use App\Http\Controllers\EgresoController;
use App\Http\Controllers\EgresoRecurrenteController;
use App\Http\Controllers\IngresoCobroController;
use App\Http\Controllers\IngresoController;
use App\Http\Controllers\PresupuestoPagoController;
use App\Http\Controllers\RecuperarContrasenaController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/solicitar-contrasena', [RecuperarContrasenaController::class, 'solicitar'])->middleware('throttle:5,1');
Route::post('/restablecer-contrasena', [RecuperarContrasenaController::class, 'restablecer'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/efectivo', [DatosSincronizadosController::class, 'efectivo']);
    Route::put('/efectivo', [DatosSincronizadosController::class, 'guardarEfectivo']);
    Route::get('/pagos-programados', [DatosSincronizadosController::class, 'pagos']);
    Route::post('/pagos-programados/importar', [DatosSincronizadosController::class, 'importarPagos']);
    Route::put('/pagos-programados/{clave}', [DatosSincronizadosController::class, 'guardarPago'])->where('clave', '[a-zA-Z0-9-]{1,80}');
    Route::delete('/pagos-programados/{clave}', [DatosSincronizadosController::class, 'eliminarPago'])->where('clave', '[a-zA-Z0-9-]{1,80}');
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::prefix('dashboard')->group(function () {
        Route::get('/resumen', [DashboardController::class, 'resumen']);
        Route::get('/egresos-por-categoria', [DashboardController::class, 'egresosPorCategoria']);
        Route::get('/resumen-anual', [DashboardController::class, 'resumenAnual']);
        Route::get('/meta-ahorro', [DashboardController::class, 'metaAhorro']);
        Route::put('/meta-ahorro', [DashboardController::class, 'guardarMetaAhorro']);
        Route::delete('/meta-ahorro', [DashboardController::class, 'eliminarMetaAhorro']);
        Route::post('/meta-ahorro/{meta}/apartados', [DashboardController::class, 'guardarApartado']);
        Route::get('/presupuesto-pago', [PresupuestoPagoController::class, 'show']);
        Route::put('/presupuesto-pago', [PresupuestoPagoController::class, 'update']);
    });
    Route::post('/egresos/recurrentes/{paymentId}/{dueDate}', [EgresoRecurrenteController::class, 'store']);
    Route::delete('/egresos/recurrentes/{paymentId}/{dueDate}', [EgresoRecurrenteController::class, 'destroy']);
    Route::get('/egresos/{egreso}/devoluciones', [DevolucionController::class, 'index']);
    Route::post('/egresos/{egreso}/devoluciones', [DevolucionController::class, 'store']);
    Route::apiResource('egresos', EgresoController::class);
    Route::post('/ingresos/cobros/{receivableId}', [IngresoCobroController::class, 'store']);
    Route::delete('/ingresos/cobros/{receivableId}', [IngresoCobroController::class, 'destroy']);
    Route::apiResource('ingresos', IngresoController::class);
    Route::apiResource('categorias', CategoriaController::class);
    Route::prefix('cobros')->name('cobros.')->group(function () {
        Route::get('/', [CobroController::class, 'index'])->name('index');
        Route::post('/', [CobroController::class, 'store'])->name('store');
        Route::post('/importar', [CobroController::class, 'importar'])->name('importar');
        Route::put('/{receivableId}', [CobroController::class, 'update'])->name('update');
        Route::delete('/{receivableId}', [CobroController::class, 'destroy'])->name('destroy');
        Route::put('/{receivableId}/recibido', [CobroController::class, 'recibir'])->name('recibir');
        Route::delete('/{receivableId}/recibido', [CobroController::class, 'devolverAPendientes'])->name('devolver');
    });
});
