# casino

Landing page estática para campañas promocionales y contacto por WhatsApp.

## Para desarrollo

El sitio está implementado en un único archivo, `index.html`; no requiere Node.js, dependencias ni proceso de build. Los estilos y el JavaScript están incluidos en el HTML.

Para probarlo localmente, desde la carpeta del proyecto ejecutá:

```bash
python3 -m http.server 8000
```

Después abrí <http://localhost:8000>. También podés abrir `index.html` directamente, aunque probarlo mediante un servidor local se parece más al hosting.

### Configuración de campañas

- Editá `DEFAULT_CONFIG` en `index.html` para cambiar el teléfono por defecto, los teléfonos asociados a códigos de campaña (`refs`) y el mensaje de WhatsApp.
- Los teléfonos deben llevar código de país, solo dígitos y sin `+` ni espacios.
- Para probar una campaña, agregá `?ref=codigo` a la URL. También se admite `?phone=595...` para indicar un número directamente.
- El panel `?admin=1` guarda cambios solamente en el `localStorage` del navegador actual. Para publicar cambios, copiá la configuración desde el panel y actualizá `DEFAULT_CONFIG` en el archivo fuente; luego hacé commit y desplegá.

## Publicación en GitHub Pages

Este proyecto no necesita compilación. GitHub Pages puede servir directamente el `index.html` desde la raíz del repositorio.

1. Subí el proyecto a un repositorio de GitHub y confirmá que `index.html` está en la raíz. Para un sitio público, el repositorio debe ser público, salvo que tu plan de GitHub permita publicar Pages desde repositorios privados.
2. En GitHub, abrí **Settings → Pages**.
3. En **Build and deployment**, elegí **Deploy from a branch**; seleccioná la rama de publicación (por ejemplo, `main`) y la carpeta **/(root)**, y guardá.
4. Esperá a que termine el despliegue. La URL aparecerá en esa misma sección. Para un repositorio normal suele tener el formato `https://USUARIO.github.io/REPOSITORIO/`; si el repositorio se llama `USUARIO.github.io`, la URL es `https://USUARIO.github.io/`.
5. Abrí la URL y probá la página, el botón de WhatsApp y los enlaces de campaña. Cada cambio publicado requiere un commit y un push a la rama seleccionada.

No agregues rutas de recursos que empiecen por `/` si más adelante incorporás archivos: en un sitio de proyecto, esa ruta apunta a la raíz del dominio y no a `/REPOSITORIO/`. Usá rutas relativas o comprobá la configuración antes de publicar.

## Añadir un dominio propio más adelante

Cuando tengas el dominio, configurá primero el dominio en **Settings → Pages → Custom domain** y seguí las instrucciones que GitHub muestre para ese repositorio. Luego agregá en el panel DNS de tu proveedor los registros que correspondan. Como referencia habitual:

- Para un dominio raíz, como `ejemplo.com`, agregá registros **A** hacia las direcciones IPv4 de GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`.
- Para un subdominio, como `www.ejemplo.com`, agregá un **CNAME** que apunte a `USUARIO.github.io` (reemplazá `USUARIO` por tu cuenta u organización de GitHub; no incluyas el nombre del repositorio).
- Si querés que funcionen tanto el dominio raíz como `www`, configurá ambos en DNS y el dominio preferido en Pages siguiendo la documentación de GitHub.

La propagación DNS y la emisión del certificado pueden tardar. Cuando GitHub indique que el dominio está verificado y el certificado está listo, activá **Enforce HTTPS** en Pages. No configures un registro DNS que apunte a una IP antigua o a otro proveedor; consultá las instrucciones actuales de GitHub Pages antes de cambiar DNS.

## Notas de producción y seguridad

- Todo lo publicado en GitHub Pages es contenido del lado del cliente y debe considerarse público. No guardes contraseñas, tokens ni datos privados en `index.html`, en el repositorio ni en la configuración de campañas.
- El PIN del panel de administración es solo una barrera visual en JavaScript; no protege la configuración ni constituye autenticación. El PIN predeterminado es `admin` y cambiarlo no lo vuelve seguro: cualquier visitante puede inspeccionar el código fuente. No uses el panel como sistema de administración seguro.
- Los cambios del panel quedan en el navegador local y no se sincronizan con GitHub Pages. Para que sean iguales para todos los visitantes, actualizá `DEFAULT_CONFIG` en el código y desplegá la modificación.
- Antes de publicar, verificá el número de WhatsApp, el texto de la oferta, los códigos de campaña y el comportamiento del contador. El contador termina a la medianoche según la hora local del visitante.
- Las tipografías se cargan desde Google Fonts; si ese servicio no está disponible, se usarán fuentes alternativas del sistema.
