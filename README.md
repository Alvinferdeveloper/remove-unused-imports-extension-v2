# 🧹 Remove Unused JS/TS Imports

**Remove Unused JS/TS Imports** es una extensión para VS Code que te ayuda a mantener tu código JavaScript y TypeScript limpio y ordenado eliminando automáticamente importaciones innecesarias.

---

## 🚀 Funcionalidades

### 1. Eliminar importaciones no utilizadas del archivo actual
Limpia tu archivo activo en un solo clic o comando, eliminando todas las importaciones que no están siendo usadas.

### 2. Eliminar importaciones no utilizadas de todo el proyecto
Realiza una limpieza profunda de todos los archivos `.js` y `.ts` en tu proyecto, removiendo cualquier importación no usada.

---

## 🧠 ¿Por qué usar esta extensión?

✅ Código más limpio  
✅ Reducción de errores innecesarios  
✅ Evita warnings en el linter  
✅ Mejora la mantenibilidad del código

---

## 🎬 Demo

A continuación puedes ver un ejemplo de cómo funciona la extensión:

![Demo de Clean Imports](/images/extension_demo.gif)

---

## ⚙️ Cómo usar

### 📄 Limpiar el archivo actual

Abre la paleta de comandos (`Ctrl+Shift+P` o `Cmd+Shift+P` en Mac) y ejecuta:
Remove Unused Imports (File) para analizar el archivo actual
Remove Unused Imports (Project) para analizar el proyecto completo

---

## 🛠️ Personalización de excludePath

Puedes personalizar qué archivos y carpetas serán excluidos del análisis de la extensión modificando la opcion `excludePath` desde la configuración gráfica de VS Code.

- **excludePath**: Especifica los patrones de archivos y carpetas que serán ignorados (por ejemplo, `node_modules`, carpetas de build, etc).

### Cómo modificarlos desde la interfaz gráfica

1. Abre la configuración de VS Code presionando `Ctrl + ,` (o desde el menú: Archivo > Preferencias > Configuración).
2. En la barra de búsqueda de la parte superior, escribe `Remove Unused JS/TS Imports` para filtrar las opciones de la extensión.
3. Localiza la opción `Exclude Path`.
4. Edita los valores según los patrones de archivos y carpetas que deseas excluir. Puedes agregar múltiples rutas usando los botones de la interfaz.

Esto te permite personalizar fácilmente el alcance del análisis sin necesidad de editar archivos JSON manualmente.

---


