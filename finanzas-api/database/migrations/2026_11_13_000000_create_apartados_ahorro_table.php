<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apartados_ahorro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meta_ahorro_id')->constrained('metas_ahorro')->cascadeOnDelete();
            $table->uuid('operacion');
            $table->decimal('monto', 12, 2);
            $table->timestamps();
            $table->unique(['meta_ahorro_id', 'operacion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apartados_ahorro');
    }
};
