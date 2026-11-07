<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('citas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('clientes');
            $table->foreignId('especialista_id')->constrained('especialistas');
            $table->foreignId('cabina_id')->constrained('cabinas');
            $table->foreignId('estado_cita_id')->constrained('estados_cita');
            $table->date('fecha');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->timestamps();
            $table->index(['especialista_id', 'fecha', 'hora_inicio']);
            $table->index(['cabina_id', 'fecha', 'hora_inicio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citas');
    }
};
