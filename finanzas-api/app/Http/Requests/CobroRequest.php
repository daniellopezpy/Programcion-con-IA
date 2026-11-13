<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CobroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->route('receivableId') !== null) {
            $this->merge(['id' => $this->route('receivableId')]);
        }
    }

    public function rules(): array
    {
        $id = ['bail', 'required', 'string', 'max:80', 'regex:/\A[a-zA-Z0-9-]+\z/'];
        $fecha = ['bail', 'nullable', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2100-12-31'];
        $campos = [
            'person' => ['bail', 'required', 'string', 'max:100'],
            'amount' => ['bail', 'required', 'numeric', 'decimal:0,2', 'gt:0', 'max:9999999999.99'],
            'dueDate' => $fecha,
            'note' => ['nullable', 'string', 'max:500'],
        ];

        return match ($this->route()->getName()) {
            'cobros.importar' => [
                'items' => ['present', 'array', 'list', 'max:50'],
                'items.*' => ['required', 'array'],
                'items.*.id' => [...$id, 'distinct:strict'],
                'items.*.person' => $campos['person'],
                'items.*.amount' => $campos['amount'],
                'items.*.dueDate' => $campos['dueDate'],
                'items.*.note' => $campos['note'],
                'items.*.collectedDate' => $fecha,
            ],
            'cobros.store' => ['id' => $id, ...$campos],
            'cobros.update' => [
                'id' => $id,
                ...array_map(fn (array $reglas) => ['sometimes', ...$reglas], $campos),
            ],
            default => ['id' => $id],
        };
    }

    public function messages(): array
    {
        return [
            'id.*' => 'El identificador del cobro no es válido.',
            'person.required' => 'Escribe un nombre.',
            'person.max' => 'El nombre no puede superar 100 caracteres.',
            'amount.required' => 'Indica el monto del cobro.',
            'amount.numeric' => 'El monto debe ser un número.',
            'amount.decimal' => 'Usa como máximo dos decimales.',
            'amount.gt' => 'El monto debe ser mayor que cero.',
            'amount.max' => 'El monto es demasiado alto.',
            'dueDate.*' => 'Elige una fecha válida entre 2000 y 2100.',
            'note.max' => 'La nota no puede superar 500 caracteres.',
        ];
    }
}
