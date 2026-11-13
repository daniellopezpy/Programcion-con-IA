<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('egresos', function (Blueprint $table) {
            $table->char('pago_recurrente_clave', 64)->nullable();
            $table->unique(['user_id', 'pago_recurrente_clave']);
        });
    }

    public function down(): void
    {
        Schema::table('egresos', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'pago_recurrente_clave']);
            $table->dropColumn('pago_recurrente_clave');
        });
    }
};
