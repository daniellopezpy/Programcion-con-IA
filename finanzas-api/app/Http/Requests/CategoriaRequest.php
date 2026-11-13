<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoriaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => [
                'required',
                'string',
                'max:80',
                Rule::unique('categorias', 'nombre')
                    ->where(fn (Builder $query) => $query
                        ->where('user_id', $this->user()->getKey())
                        ->where('tipo', $this->input('tipo')))
                    ->ignore($this->route('categoria')),
            ],
            'tipo' => ['required', Rule::in(['ingreso', 'egreso'])],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio.',
            'nombre.max' => 'El nombre no puede exceder 80 caracteres.',
            'nombre.unique' => 'Ya tienes una categoría con ese nombre y tipo.',
            'tipo.required' => 'El tipo es obligatorio.',
            'tipo.in' => 'El tipo debe ser ingreso o egreso.',
        ];
    }
}
