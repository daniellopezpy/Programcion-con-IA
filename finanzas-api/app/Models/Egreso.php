<?php

namespace App\Models;

use Database\Factories\EgresoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'categoria_id',
    'subcategoria_id',
    'fecha',
    'descripcion',
    'monto',
    'notas',
    'pago_recurrente_clave',
])]
#[Hidden(['pago_recurrente_clave'])]
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
        return $query
            ->whereYear('fecha', $anio)
            ->whereMonth('fecha', $mes);
    }

    public function devoluciones(): HasMany
    {
        return $this->hasMany(Ingreso::class, 'egreso_devolucion_id');
    }
}
