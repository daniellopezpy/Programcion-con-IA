<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\EgresoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'categoria_id',
    'subcategoria_id',
    'fecha',
    'descripcion',
    'monto',
    'notas',
])]
class Egreso extends Model
{
    /** @use HasFactory<EgresoFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'monto' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function subcategoria(): BelongsTo
    {
        return $this->belongsTo(Subcategoria::class);
    }

    public function scopeDelMes(Builder $query, int $anio, int $mes): Builder
    {
        $inicio = CarbonImmutable::create($anio, $mes, 1);

        return $this->scopeEntreFechas($query, $inicio, $inicio->endOfMonth());
    }

    public function scopeEntreFechas(
        Builder $query,
        CarbonInterface|string $desde,
        CarbonInterface|string $hasta,
    ): Builder {
        return $query->whereBetween('fecha', [
            $desde instanceof CarbonInterface ? $desde->toDateString() : $desde,
            $hasta instanceof CarbonInterface ? $hasta->toDateString() : $hasta,
        ]);
    }
}
