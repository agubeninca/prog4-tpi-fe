// Avisos al cliente cuando su pedido está listo: sonido, vibración y el título de la pestaña.
// Todo es opcional y tolerante a fallas: algunos navegadores bloquean el audio o no vibran.

/** Dos tonos cortos ("ding-dong"). */
export function sonar() {
  try {
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return;
    const audio = new Contexto();
    [660, 880].forEach((frecuencia, i) => {
      const oscilador = audio.createOscillator();
      const volumen = audio.createGain();
      const inicio = audio.currentTime + i * 0.22;
      oscilador.frequency.value = frecuencia;
      volumen.gain.setValueAtTime(0.0001, inicio);
      volumen.gain.exponentialRampToValueAtTime(0.25, inicio + 0.02);
      volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.3);
      oscilador.connect(volumen).connect(audio.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + 0.32);
    });
    setTimeout(() => void audio.close(), 900);
  } catch {
    // Sin audio: el aviso en pantalla alcanza.
  }
}

export function vibrar() {
  try {
    navigator.vibrate?.([220, 100, 220]);
  } catch {
    // Sin vibración.
  }
}

/** Si la pestaña está en segundo plano, cambia el título hasta que el cliente vuelve. */
export function resaltarTitulo(texto: string) {
  if (!document.hidden) return;
  const original = document.title;
  document.title = texto;
  const restaurar = () => {
    if (document.hidden) return;
    document.title = original;
    document.removeEventListener('visibilitychange', restaurar);
  };
  document.addEventListener('visibilitychange', restaurar);
}
