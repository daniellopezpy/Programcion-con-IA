<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('efectivo', 12, 2)->nullable();
        });
        Schema::create('pagos_programados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('clave', 80);
            $table->json('configuracion');
            $table->json('fechas_pagadas');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['user_id', 'clave']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_programados');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('efectivo');
        });
    }
};
