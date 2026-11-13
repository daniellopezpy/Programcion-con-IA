<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ingresos', function (Blueprint $table) {
            $table->foreignId('egreso_devolucion_id')->nullable()->constrained('egresos')->nullOnDelete();
            $table->uuid('devolucion_operacion')->nullable();
            $table->unique(['egreso_devolucion_id', 'devolucion_operacion'], 'ingresos_devolucion_operacion_unique');
        });
    }

    public function down(): void
    {
        Schema::table('ingresos', function (Blueprint $table) {
            $table->dropUnique('ingresos_devolucion_operacion_unique');
            $table->dropConstrainedForeignId('egreso_devolucion_id');
            $table->dropColumn('devolucion_operacion');
        });
    }
};
