# DNT Messenger Satellite — Módulo de Mensajería Interna (Sprint 1)
### Laboratorio 6: Pruebas de Software | PS-1115 (Sistemas de Información I)
**Universidad Simón Bolívar — Trimestre Septiembre - Diciembre 2026**  
**Equipo Desarrollador:** Equipo 1 — DNT Soluciones Tecnológicas  
*Integrantes:* Stefano Casale Perez, Daniela Gragirena Cortez, Nazareth Colmenares, Gabriel Orejarena.

---

## 1. Propósito del Repositorio Satélite

Este repositorio constituye una **instancia satélite aislada, reproducible e independiente** del módulo de Mensajería Interna desarrollado por DNT Soluciones Tecnológicas durante el Sprint 1. 

Ha sido empaquetado exclusivamente para facilitar el proceso de **coevaluación académica entre pares** de la cátedra PS-1115 (Lista de Verificación de Pruebas de Software), garantizando:
1. **Aislamiento de Seguridad:** Cero filtración de credenciales productivas, datos corporativos ni código de otros módulos del ERP.
2. **Reproducibilidad Inmediata:** La base de datos SQLite viene lista para operar sin dependencias complejas de servidores externos ni bases de datos en la nube.
3. **Paridad Total con los Entregables:** La suite de pruebas de 17 casos (7 unitarias y 10 de integración) es idéntica a la documentada y auditada en las Asignaciones 1, 2 y 3.
4. **Experiencia Web Integrada:** Incluye tanto una interfaz web interactiva servida directamente por Django como el paquete completo de componentes React/Next.js.

---

## 2. Tabla de Credenciales y Sesiones Preconfiguradas

Para permitir una evaluación exhaustiva de los roles comerciales, control de acceso y flujos conversacionales, la base de datos cuenta con **8 usuarios preconfigurados**.

> **Contraseña Universal para todos los usuarios:**  
> `Password2026!`

| Usuario (`username`) | Nombre Completo | Rol Comercial | Sede Asignada | Permiso Creación Grupos |
| :--- | :--- | :--- | :--- | :---: |
| **`torbet`** | Torbet Evaluador | `manager` (Gerencia) | Sede Principal | **Autorizado (201)** |
| **`samuel`** | Samuel Evaluador | `seller` (Ventas) | Sede Este | *Denegado (403)* |
| **`nadheska`** | Nadheska Evaluadora | `admin` (Administración) | Sede Oeste | **Autorizado (201)** |
| **`ernesto`** | Ernesto Evaluador | `mechanic` (Taller) | Sede Principal | *Denegado (403)* |
| **`stefano`** | Stefano Casale | `admin` (Administración) | Sede Principal | **Autorizado (201)** |
| **`daniela`** | Daniela Gragirena | `manager` (Gerencia) | Sede Este | **Autorizado (201)** |
| **`gabriel`** | Gabriel Orejarena | `seller` (Ventas) | Sede Principal | *Denegado (403)* |
| **`nazareth`** | Nazareth Colmenares | `mechanic` (Taller) | Sede Oeste | *Denegado (403)* |

---

## 3. Puesta en Marcha Rápida (Zero Friction)

### Requisitos Previos
- Python 3.10, 3.11 o 3.12 instalado.
- Python 3.10, 3.11 o 3.12 instalado con `pip`.
- Node.js v18+ o v20+ con `npm` o `pnpm`.

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/19-10114/DNT_messenger.git
cd DNT_messenger
```

### Paso 2: Iniciar el Backend (Django)
```bash
cd backend
python -m venv .venv

# En Windows:
.venv\Scripts\activate
# En Linux / macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_eval_data
python manage.py runserver
```
*El backend quedará escuchando en `http://localhost:8000/api/` con la base de datos pre-poblada con las 8 cuentas y chats demostrativos.*

### Paso 3: Iniciar el Frontend Real (Next.js)
En una nueva terminal:
```bash
cd DNT_messenger/frontend
npm install
npm run dev
```

### Paso 4: Abrir la Aplicación Web Oficial
Abra su navegador web en:  
👉 **`http://localhost:3001/`** (o `http://localhost:3000/`)

1. Haga clic en **"Iniciar Sesión"** en la barra superior de navegación.
2. Ingrese con cualquiera de las **8 cuentas preconfiguradas** (ej. Usuario: `stefano`, `torbet`, `daniela` o `samuel` / Contraseña: `Password2026!`).
3. Será redirigido directamente al módulo de mensajería interna en **`/dashboard/messenger`**, donde dispondrá de la experiencia completa, idéntica y oficial desarrollada durante el Sprint 1:
   - Panel de conversaciones con filtro dinámico por sucursal.
   - Apertura y gestión de chats directos 1 a 1 y salas grupales corporativas.
   - Burbujas de mensajes con colapso suave de textos extensos.
   - Barra superior con identificador de `Rol • Sucursal`.
   - Control de permisos en creación de grupos (Solo Administradores y Gerentes).

---

## 4. Ejecución de Pruebas Automatizadas

El proyecto cuenta con **17 pruebas automatizadas** que cubren exhaustivamente el modelo de datos y las capas API REST.

### A) Ejecutar la Suite Completa de Pruebas
```bash
python manage.py test messenger
```
**Salida esperada:**
```text
Creating test database for alias 'default'...
Found 17 test(s).
System check identified no issues (0 silenced).
.................
----------------------------------------------------------------------
Ran 17 tests in ~1.5s

OK
Destroying test database for alias 'default'...
```

### B) Medición de Cobertura de Código (Coverage)
Para verificar la métrica de cobertura de código exigida por la rúbrica (reporta **≥ 93%** de cobertura en el módulo `messenger`):

```bash
coverage run --source="messenger" manage.py test messenger
coverage report
```
**Salida esperada:**
```text
Name                                     Stmts   Miss  Cover
------------------------------------------------------------
messenger/models.py                         36      3    92%
messenger/serializers.py                   103      6    94%
messenger/views.py                          93      7    92%
...
------------------------------------------------------------
TOTAL                                      451     16    96%
```

---

## 5. Guía para Inyección de Defecto Deliberado (Tabla 5 de la Rúbrica)

La rúbrica de coevaluación solicita al equipo evaluador alterar deliberadamente el código bajo prueba para verificar que el ejecutor de pruebas capture la regresión y retorne fallo (`FAIL`).

Ponemos a su disposición dos alternativas sencillas y directas:

### Opción 1: Defecto en Pruebas Unitarias (CU-005)
1. Abra el archivo `backend/messenger/models.py`.
2. Ubique la clase `ConversationMember` (aproximadamente línea 31).
3. Agregue el siguiente método para forzar que cualquier miembro se guarde siempre con rol `'admin'`:
   ```python
   def save(self, *args, **kwargs):
       self.role = 'admin'
       super().save(*args, **kwargs)
   ```
4. Guarde el archivo y ejecute:
   ```bash
   python manage.py test messenger
   ```
5. **Resultado Verificado:** La prueba unitaria `test_conversation_member_role` falla de inmediato reportando:
   ```text
   FAIL: test_conversation_member_role (messenger.tests.test_models.MessengerModelTests.test_conversation_member_role)
   AssertionError: 'admin' != 'member'
   ```
6. *Recuerde revertir el cambio eliminando el método `save` luego de tomar su captura.*

---

### Opción 2: Defecto en Pruebas de Integración (CI-007)
1. Abra el archivo `backend/messenger/views.py`.
2. Ubique la clase `GroupConversationCreateView` y su método `post` (aproximadamente línea 81).
3. Comente la cláusula que valida los permisos de administrador/gerente:
   ```python
   # if not is_admin_or_manager and not request.user.is_staff:
   #     return get_failed_response(
   #         message='Solo administradores y gerentes pueden crear grupos',
   #         status_code=status.HTTP_403_FORBIDDEN,
   #     )
   ```
4. Guarde el archivo y ejecute:
   ```bash
   python manage.py test messenger
   ```
5. **Resultado Verificado:** La prueba de integración `test_create_group_forbidden_for_regular_user` falla reportando:
   ```text
   FAIL: test_create_group_forbidden_for_regular_user (messenger.tests.test_views.MessengerAPITestCase.test_create_group_forbidden_for_regular_user)
   AssertionError: 201 != 403
   ```
6. *Recuerde revertir el cambio descomentando la validación.*

---

## 6. Mapeo de Endpoints y Casos de Prueba

| Endpoint | Método | Descripción | Caso de Prueba Vinculado |
| :--- | :---: | :--- | :--- |
| `/api/messenger/conversations/` | `GET` | Lista las conversaciones activas del usuario ordenadas por actividad reciente | `CI-001`, `CI-002`, `CI-005` |
| `/api/messenger/conversations/direct/` | `POST` | Abre o recupera conversación directa 1 a 1 de forma idempotente | `CI-003`, `CI-004` |
| `/api/messenger/conversations/group/` | `POST` | Crea una sala grupal privada (restringido a `admin` y `manager`) | `CI-006`, `CI-007` |
| `/api/messenger/rooms/group/` | `POST` | Alias de interoperabilidad para salas grupales | `CI-008` |
| `/api/messenger/conversations/<id>/messages/` | `GET` | Recupera el historial cronológico de mensajes de la conversación | `CI-009` |
| `/api/messenger/conversations/<id>/messages/` | `POST` | Envía y persiste un mensaje (valida membresía y límite de 4000 chars) | `CI-009`, `CU-003`, `CU-006` |
| `/api/messenger/users/?branch=<id>` | `GET` | Directorio de empleados filtrable por sede comercial | `CI-010` |
| `/api/auth/login/` | `POST` | Autenticación estándar por token DRF | Soporte sesión |
| `/api/auth/switch-session/` | `POST` | Alternancia rápida de evaluadores para testing multi-usuario | Soporte coevaluación |

---

## 7. Estructura del Repositorio

```text
dnt-messenger-satellite/
├── backend/
│   ├── core/                       # Configuración Django, enrutamiento raíz y CORS
│   │   ├── settings.py
│   │   └── urls.py
│   ├── branches/                   # Módulo de Sedes Comerciales (Principal, Este, Oeste)
│   │   └── models.py
│   ├── users/                      # Modelo de Usuarios con roles y autenticación
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── management/commands/    # Comando seed_eval_data para poblar las 8 cuentas
│   ├── messenger/                  # Módulo de Mensajería Interna bajo prueba
│   │   ├── models.py               # Conversation, ConversationMember, Message
│   │   ├── serializers.py          # Serializadores camelCase con optimización N+1
│   │   ├── views.py                # Controladores de negocio y seguridad
│   │   ├── urls.py
│   │   └── tests/                  # Suite de 17 pruebas automatizadas
│   │       ├── test_models.py      # 7 pruebas unitarias
│   │       └── test_views.py       # 10 pruebas de integración
│   ├── templates/                  # Interfaz Web interactiva integrada
│   │   └── messenger/index.html
│   ├── utils/                      # Utilidades de respuesta estándar
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3                  # Base de datos preconfigurada
├── frontend/                       # Código fuente React / Next.js del Sprint 1
│   ├── src/
│   │   ├── components/messenger/   # Componentes modulares del cliente web
│   │   ├── hooks/messenger/        # Hooks de sondeo y gestión de estado
│   │   └── services/messenger/     # Capa de consumo HTTP
│   └── package.json
├── .gitignore
└── README.md                       # Esta guía
```

---

*Cualquier inquietud técnica durante la coevaluación puede ser comunicada a los integrantes de DNT Soluciones Tecnológicas.*
