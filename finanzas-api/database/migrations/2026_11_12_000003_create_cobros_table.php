<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cobros', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('identificador', 80);
            $table->char('clave', 64);
            $table->string('persona', 100);
            $table->decimal('monto', 12, 2);
            $table->date('fecha_vencimiento')->nullable();
            $table->text('nota')->nullable();
            $table->date('fecha_recibido')->nullable();
            $table->foreignId('ingreso_id')->nullable()->constrained('ingresos')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'clave']);
            $table->index(['user_id', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cobros');
    }
};
