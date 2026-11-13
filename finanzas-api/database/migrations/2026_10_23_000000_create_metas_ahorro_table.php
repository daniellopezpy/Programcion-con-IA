<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metas_ahorro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->unsignedSmallInteger('anio');
            $table->unsignedTinyInteger('mes');
            $table->decimal('monto_objetivo', 12, 2);
            $table->timestamps();

            $table->unique(['user_id', 'anio', 'mes']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metas_ahorro');
    }
};
