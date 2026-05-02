-- Schema: PlenoEmprendo
-- Compatible con MariaDB (10.2+) y MySQL (5.7+).
-- La base de datos la selecciona initDb.ts desde DB_NAME del .env.
-- NO hardcodear el nombre aquí para que funcione en cualquier entorno.

CREATE TABLE IF NOT EXISTS leads (
  contact_id                VARCHAR(36)   NOT NULL,
  nombre                    VARCHAR(200)  NOT NULL DEFAULT '',
  telefono                  VARCHAR(50)   NOT NULL DEFAULT '',
  telefono_normalizado      VARCHAR(50)   NOT NULL DEFAULT '',
  email                     VARCHAR(180)  NOT NULL DEFAULT '',
  closer                    VARCHAR(100)  NOT NULL DEFAULT '',
  fecha_agendado            DATETIME      NULL,
  fecha_reunion             DATETIME      NULL,
  estado_lead               VARCHAR(50)   NOT NULL DEFAULT 'Lead Iniciado',
  whatsapp_enviado          TINYINT(1)    NOT NULL DEFAULT 0,
  conversacion_iniciada_por VARCHAR(20)   NOT NULL DEFAULT '',
  audio_enviado             TINYINT(1)    NOT NULL DEFAULT 0,
  fecha_creacion_grupo      DATETIME      NULL,
  descripcion_grupo         TEXT          NOT NULL DEFAULT '',
  add_foto                  TINYINT(1)    NOT NULL DEFAULT 0,
  agregar_descripcion       TINYINT(1)    NOT NULL DEFAULT 0,
  link_enviado              TINYINT(1)    NOT NULL DEFAULT 0,
  fecha_envio_link          DATETIME      NULL,
  cliente_en_grupo          TINYINT(1)    NOT NULL DEFAULT 0,
  enviar_primer_mensaje     TINYINT(1)    NOT NULL DEFAULT 0,
  primer_mensaje_tipo       VARCHAR(50)   NOT NULL DEFAULT '',
  paso_a_closer             TINYINT(1)    NOT NULL DEFAULT 0,
  fecha_paso_a_closer       DATETIME      NULL,
  fecha_ultimo_seguimiento  DATETIME      NULL,
  reintentos_seguimiento    INT           NOT NULL DEFAULT 0,
  seguimiento_marcado       TINYINT(1)    NOT NULL DEFAULT 0,
  posible_duplicado         TINYINT(1)    NOT NULL DEFAULT 0,
  duplicado_chequeado       TINYINT(1)    NOT NULL DEFAULT 0,
  cerrado_manual            TINYINT(1)    NOT NULL DEFAULT 0,
  observaciones             TEXT          NOT NULL DEFAULT '',
  ultima_actualizacion      DATETIME      NULL,
  source                    VARCHAR(20)   NOT NULL DEFAULT 'secondary',
  created_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (contact_id),
  KEY idx_estado (estado_lead),
  KEY idx_telefono_norm (telefono_normalizado),
  KEY idx_closer (closer),
  KEY idx_fecha_agendado (fecha_agendado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pleno_credentials (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  password_hash  VARCHAR(255)  NOT NULL,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
