<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['clave', 'configuracion', 'fechas_pagadas'])]
class PagoProgramado extends Model
{
    use SoftDeletes;

    protected $table = 'pagos_programados';

    protected function casts(): array
    {
        return ['configuracion' => 'array', 'fechas_pagadas' => 'array'];
    }

    public function createdOn(): ?string
    {
        if (! $this->created_at) {
            return null;
        }

        return CarbonImmutable::instance($this->created_at)
            ->timezone('America/Guatemala')
            ->toDateString();
    }

    public function scheduleHistory(): array
    {
        $history = $this->configuracion['schedule_history'] ?? $this->configuracion['scheduleHistory'] ?? null;
        if (is_array($history) && ! empty($history)) {
            $formatted = [];
            foreach ($history as $stage) {
                if (! isset($stage['startsOn']) || ! isset($stage['days'])) {
                    continue;
                }
                $formatted[] = [
                    'startsOn' => (string) $stage['startsOn'],
                    'days' => array_values(array_unique(array_map('intval', (array) $stage['days']))),
                ];
            }
            if (! empty($formatted)) {
                usort($formatted, fn ($a, $b) => strcmp($a['startsOn'], $b['startsOn']));

                return array_values($formatted);
            }
        }

        $createdOn = $this->createdOn();
        if ($createdOn === null) {
            return [];
        }

        $days = $this->configuracion['days'] ?? [];

        return [
            [
                'startsOn' => $createdOn,
                'days' => array_values(array_unique(array_map('intval', (array) $days))),
            ],
        ];
    }

    public function etapaParaFecha(string $fecha): ?array
    {
        $createdOn = $this->createdOn();
        if ($createdOn === null || $fecha < $createdOn) {
            return null;
        }

        $etapaActiva = null;
        foreach ($this->scheduleHistory() as $etapa) {
            if ($etapa['startsOn'] <= $fecha) {
                $etapaActiva = $etapa;
            } else {
                break;
            }
        }

        return $etapaActiva;
    }

    public function esVencimientoValido(string $fecha): bool
    {
        $etapa = $this->etapaParaFecha($fecha);
        if ($etapa === null) {
            return false;
        }

        $carbon = CarbonImmutable::parse($fecha);
        $dias = array_map(fn (int $dia) => min($dia, $carbon->daysInMonth), $etapa['days']);

        return in_array($carbon->day, $dias, true);
    }

    public function datos(): array
    {
        $config = $this->configuracion ?? [];
        unset($config['schedule_history'], $config['scheduleHistory'], $config['createdOn']);

        return [
            ...$config,
            'id' => $this->clave,
            'paidDates' => $this->fechas_pagadas ?? [],
            'createdOn' => $this->createdOn(),
            'scheduleHistory' => $this->scheduleHistory(),
        ];
    }

    public function cambiarFechaPagada(string $fecha, bool $pagada): void
    {
        $fechas = array_values(array_diff($this->fechas_pagadas ?? [], [$fecha]));
        if ($pagada) {
            $fechas[] = $fecha;
        }
        sort($fechas);
        $this->update(['fechas_pagadas' => $fechas]);
    }
}
