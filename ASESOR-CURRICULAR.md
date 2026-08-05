# Asesor de Diseño Curricular

## Estado de la rama

Esta rama integra, sin reemplazar la matriz original:

1. **Matriz original (`app.html`)**: creación y edición de agrupamientos, selección y movimiento de contenidos, objetivos y contexto.
2. **Mapa vivo (`constructor-curricular.html`)**: organización de espacios entre C1 y C10 con recalculo inmediato.
3. **Tablero (`asesor-curricular.html`)**: cobertura curricular, carga horaria y alertas.
4. **Mapa detallado (`trayectoria-pci.html`)**: trayectoria ampliada e imprimible.
5. **Acceso integrado (`launcher-asesor.html`)**: selector de escuelas 1 a 3, carga desde Supabase y guardado online.

## Acceso de prueba

Abrir `launcher-asesor.html` desde la rama `desarrollo-asesor-curricular` usando un servidor web o un visor de ramas compatible con archivos HTML.

La plataforma publicada en `main` no se modifica.

## Fuente de datos

- Estado de la propuesta: `localStorage.pciAppV2`.
- Escuela activa: `localStorage.pciActiveSchool`.
- Persistencia online: tabla `pci_proposals` de Supabase.
- Contenidos priorizados: archivos comprimidos ubicados en `data/`.
- Reglas curriculares: `data/reglas-curriculares.json`.

## Reglas implementadas

- La cobertura de un contenido se cuenta una sola vez, aunque aparezca en varios espacios.
- Se muestran todas las ubicaciones donde aparece un contenido repetido.
- La cobertura prioritaria se calcula sobre Ciencias Sociales, Ciencias Naturales y Tecnologías.
- Se calcula la carga prevista y asignada por área y por cuatrimestre C1-C10.
- Las horas asignadas deben coincidir exactamente con las horas previstas.
- Se generan alertas por contenidos pendientes, déficit horario y exceso horario.
- Los agrupamientos obligatorios tienen prioridad sobre otros formatos curriculares.

## Criterio para considerar la propuesta válida

La propuesta se considera válida cuando:

- no quedan contenidos priorizados pendientes;
- no existen déficits horarios;
- no existen excesos horarios;
- las reglas bloqueantes están cumplidas.

## Pruebas manuales requeridas antes de integrar a `main`

1. Ingresar a cada escuela y verificar que la matriz original carga los datos existentes.
2. Crear o editar un agrupamiento y asignar contenidos.
3. Cambiar a Mapa vivo y verificar que aparecen los mismos agrupamientos.
4. Mover una pieza de cuatrimestre y comprobar que se conserva al regresar a la matriz.
5. Revisar cobertura, horas y alertas en el Tablero.
6. Guardar, recargar la página y confirmar la persistencia online.
7. Verificar funcionamiento en computadora y celular.
8. Confirmar que la plataforma pública de `main` permanece sin cambios.

## Limitaciones actuales

- La rama todavía requiere validación manual con datos reales de las escuelas.
- `DecompressionStream` puede no estar disponible en navegadores antiguos.
- La Escuela 4 conserva su implementación especial y aún no está incluida en `launcher-asesor.html`.
- Las horas de orientación no están incorporadas; solo se usa Formación General.
