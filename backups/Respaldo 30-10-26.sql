CREATE DATABASE  IF NOT EXISTS `db_maraton_hub` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `db_maraton_hub`;
-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: db_maraton_hub
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id_categoria` int unsigned NOT NULL AUTO_INCREMENT,
  `id_evento` int unsigned NOT NULL,
  `nombre_cat` varchar(120) NOT NULL,
  `distancia_km` decimal(6,2) NOT NULL,
  `cupo_maximo` int unsigned NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `edad_minima` tinyint unsigned DEFAULT NULL,
  `edad_maxima` tinyint unsigned DEFAULT NULL,
  `genero` enum('M','F','Mixto') NOT NULL DEFAULT 'Mixto',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `categorias_id_evento_nombre_cat_genero` (`id_evento`,`nombre_cat`,`genero`),
  KEY `categorias_id_evento` (`id_evento`),
  CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,1,'10K Libre',10.00,200,25.00,18,39,'Mixto','2026-10-30 06:32:45','2026-10-30 06:32:45'),(2,1,'10K Master',10.00,150,25.00,40,99,'Mixto','2026-10-30 06:32:45','2026-10-30 06:32:45'),(3,1,'21K Libre',21.10,100,40.00,18,99,'Mixto','2026-10-30 06:32:45','2026-10-30 06:32:45'),(4,1,'5K Femenil',5.00,80,15.00,15,99,'F','2026-10-30 06:32:45','2026-10-30 06:32:45'),(5,2,'10K Nocturno',10.00,300,20.00,18,99,'Mixto','2026-10-30 06:32:45','2026-10-30 06:32:45'),(6,2,'5K Nocturno',5.00,150,15.00,15,99,'Mixto','2026-10-30 06:32:45','2026-10-30 06:32:45'),(8,4,'Infantil',10.00,100,30.00,5,12,'Mixto','2026-10-30 19:47:42','2026-10-30 19:47:42'),(9,4,'Juvenil',10.00,100,30.00,13,17,'M','2026-10-30 19:48:14','2026-10-30 19:48:14');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dorsales`
--

DROP TABLE IF EXISTS `dorsales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dorsales` (
  `id_dorsal` int unsigned NOT NULL AUTO_INCREMENT,
  `id_inscripcion` int unsigned NOT NULL,
  `numero_dorsal` int unsigned NOT NULL,
  `chip_code` varchar(60) DEFAULT NULL,
  `estado_kit` enum('pendiente','entregado') NOT NULL DEFAULT 'pendiente',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id_dorsal`),
  UNIQUE KEY `id_inscripcion` (`id_inscripcion`),
  UNIQUE KEY `numero_dorsal` (`numero_dorsal`),
  UNIQUE KEY `dorsales_id_inscripcion` (`id_inscripcion`),
  UNIQUE KEY `dorsales_numero_dorsal` (`numero_dorsal`),
  UNIQUE KEY `chip_code` (`chip_code`),
  UNIQUE KEY `dorsales_chip_code` (`chip_code`),
  KEY `dorsales_estado_kit` (`estado_kit`),
  CONSTRAINT `dorsales_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripciones` (`id_inscripcion`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dorsales`
--

LOCK TABLES `dorsales` WRITE;
/*!40000 ALTER TABLE `dorsales` DISABLE KEYS */;
INSERT INTO `dorsales` VALUES (1,1,1001,'CHIP-1001','entregado','2026-10-30 06:32:45','2026-10-30 06:32:45'),(2,2,1002,'CHIP-1002','entregado','2026-10-30 06:32:45','2026-10-30 06:32:45'),(3,3,1003,'CHIP-1003','entregado','2026-10-30 06:32:45','2026-10-30 06:32:45'),(4,4,1004,'CHIP-1004','entregado','2026-10-30 06:32:45','2026-10-30 06:32:45'),(5,5,1005,'CHIP-1005','entregado','2026-10-30 06:32:45','2026-10-30 06:32:45'),(6,6,1006,'CHIP-1006','entregado','2026-10-30 06:32:45','2026-10-30 06:32:45'),(7,7,1007,'CHIP-1007','entregado','2026-10-30 06:32:45','2026-10-30 06:32:45'),(8,8,1008,NULL,'entregado','2026-10-30 07:27:37','2026-10-30 07:29:01'),(9,9,1009,NULL,'pendiente','2026-10-30 08:06:29','2026-10-30 08:06:29'),(10,10,1010,NULL,'pendiente','2026-10-30 19:37:27','2026-10-30 19:37:27');
/*!40000 ALTER TABLE `dorsales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventos`
--

DROP TABLE IF EXISTS `eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos` (
  `id_evento` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_evento` varchar(150) NOT NULL,
  `descripcion` text,
  `fecha_evento` datetime NOT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `lugar_salida` varchar(150) DEFAULT NULL,
  `estado` enum('borrador','publicado','en_curso','finalizado') NOT NULL DEFAULT 'borrador',
  `imagen_banner` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `eventos_estado` (`estado`),
  KEY `eventos_fecha_evento` (`fecha_evento`),
  KEY `eventos_ciudad` (`ciudad`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
INSERT INTO `eventos` VALUES (1,'Maraton de la Ciudad 2026','Evento de demostracion con resultados, kits y cronometraje ya registrados.','2026-10-30 04:32:00','Ciudad de Panama','Parque Omar','en_curso','https://images.example.com/maraton-ciudad-2026.jpg','2026-10-30 06:32:45','2026-10-30 06:32:45'),(2,'Carrera Nocturna 2026','Evento abierto para probar el flujo completo de inscripciones.','2026-11-29 06:32:45','Ciudad de Panama','Cinta Costera','publicado','https://images.example.com/carrera-nocturna-2026.jpg','2026-10-30 06:32:45','2026-10-30 06:32:45'),(4,'Entre la Vida y la muerte','Carrera para conmemorar a los muertos','2026-10-31 19:46:00','Xicotepec','Universidad Tecnologica de Xicotepec de Juarez','publicado',NULL,'2026-10-30 19:46:48','2026-10-30 19:46:48');
/*!40000 ALTER TABLE `eventos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripciones`
--

DROP TABLE IF EXISTS `inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripciones` (
  `id_inscripcion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `id_categoria` int unsigned NOT NULL,
  `codigo_transaccion` varchar(100) DEFAULT NULL,
  `estado_pago` enum('pendiente','completado','cancelado') NOT NULL DEFAULT 'pendiente',
  `talla_camiseta` varchar(10) DEFAULT NULL,
  `fecha_inscripcion` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id_inscripcion`),
  UNIQUE KEY `inscripciones_id_usuario_id_categoria` (`id_usuario`,`id_categoria`),
  KEY `inscripciones_id_usuario` (`id_usuario`),
  KEY `inscripciones_id_categoria` (`id_categoria`),
  KEY `inscripciones_estado_pago` (`estado_pago`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripciones`
--

LOCK TABLES `inscripciones` WRITE;
/*!40000 ALTER TABLE `inscripciones` DISABLE KEYS */;
INSERT INTO `inscripciones` VALUES (1,3,1,'TX-DEMO-3','completado','S','2026-10-23 06:32:45','2026-10-30 06:32:45','2026-10-30 06:32:45'),(2,4,1,'TX-DEMO-4','completado','M','2026-10-23 06:32:45','2026-10-30 06:32:45','2026-10-30 06:32:45'),(3,5,1,'TX-DEMO-5','completado','L','2026-10-23 06:32:45','2026-10-30 06:32:45','2026-10-30 06:32:45'),(4,6,1,'TX-DEMO-6','completado','S','2026-10-23 06:32:45','2026-10-30 06:32:45','2026-10-30 06:32:45'),(5,7,2,'TX-DEMO-7','completado','M','2026-10-23 06:32:45','2026-10-30 06:32:45','2026-10-30 06:32:45'),(6,8,4,'TX-DEMO-8','completado','L','2026-10-23 06:32:45','2026-10-30 06:32:45','2026-10-30 06:32:45'),(7,9,3,'TX-DEMO-9','completado','S','2026-10-23 06:32:45','2026-10-30 06:32:45','2026-10-30 06:32:45'),(8,3,6,'CARD-4242-MVUNGOF7','completado','M','2026-10-30 07:27:37','2026-10-30 07:27:37','2026-10-30 07:27:37'),(9,11,6,'CARD-3456-MVUOUNW6','completado','M','2026-10-30 08:06:29','2026-10-30 08:06:29','2026-10-30 08:06:29'),(10,12,5,'CARD-9876-MVVDJ8LR','completado','M','2026-10-30 19:37:27','2026-10-30 19:37:27','2026-10-30 19:37:31');
/*!40000 ALTER TABLE `inscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_rol` enum('admin','staff','corredor') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','2026-10-30 06:32:35','2026-10-30 06:32:35'),(2,'staff','2026-10-30 06:32:35','2026-10-30 06:32:35'),(3,'corredor','2026-10-30 06:32:35','2026-10-30 06:32:35');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tiempos_checkpoints`
--

DROP TABLE IF EXISTS `tiempos_checkpoints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiempos_checkpoints` (
  `id_tiempo` int unsigned NOT NULL AUTO_INCREMENT,
  `id_dorsal` int unsigned NOT NULL,
  `nombre_punto` varchar(60) NOT NULL,
  `tiempo_marcado` datetime NOT NULL,
  `id_staff_registro` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id_tiempo`),
  UNIQUE KEY `tiempos_checkpoints_id_dorsal_nombre_punto` (`id_dorsal`,`nombre_punto`),
  KEY `tiempos_checkpoints_nombre_punto` (`nombre_punto`),
  KEY `tiempos_checkpoints_tiempo_marcado` (`tiempo_marcado`),
  KEY `tiempos_checkpoints_id_staff_registro` (`id_staff_registro`),
  CONSTRAINT `tiempos_checkpoints_ibfk_1` FOREIGN KEY (`id_dorsal`) REFERENCES `dorsales` (`id_dorsal`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tiempos_checkpoints_ibfk_2` FOREIGN KEY (`id_staff_registro`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiempos_checkpoints`
--

LOCK TABLES `tiempos_checkpoints` WRITE;
/*!40000 ALTER TABLE `tiempos_checkpoints` DISABLE KEYS */;
INSERT INTO `tiempos_checkpoints` VALUES (1,1,'SALIDA','2026-10-30 04:32:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(2,1,'KM 5','2026-10-30 04:57:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(3,1,'META','2026-10-30 05:24:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(4,2,'SALIDA','2026-10-30 04:32:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(5,2,'KM 5','2026-10-30 04:56:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(6,2,'META','2026-10-30 05:21:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(7,3,'SALIDA','2026-10-30 04:32:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(8,3,'KM 5','2026-10-30 04:55:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(9,3,'META','2026-10-30 05:19:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(10,4,'SALIDA','2026-10-30 04:32:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(11,4,'KM 5','2026-10-30 04:58:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(12,4,'META','2026-10-30 05:27:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(13,5,'SALIDA','2026-10-30 04:32:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(14,5,'KM 5','2026-10-30 05:00:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(15,5,'META','2026-10-30 05:30:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(16,6,'SALIDA','2026-10-30 04:32:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(17,6,'META','2026-10-30 04:59:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(18,7,'SALIDA','2026-10-30 04:32:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(19,7,'KM 5','2026-10-30 04:57:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45'),(20,7,'KM 10','2026-10-30 05:22:00',NULL,'2026-10-30 06:32:45','2026-10-30 06:32:45');
/*!40000 ALTER TABLE `tiempos_checkpoints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int unsigned NOT NULL AUTO_INCREMENT,
  `id_rol` int unsigned NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `contacto_emergencia` varchar(150) DEFAULT NULL,
  `ficha_medica_json` json DEFAULT NULL,
  `modo_oscuro_pref` tinyint(1) NOT NULL DEFAULT '0',
  `estado_cuenta` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('M','F') DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `usuarios_email` (`email`),
  KEY `usuarios_id_rol` (`id_rol`),
  KEY `usuarios_estado_cuenta` (`estado_cuenta`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'Administrador','MarathonHub','admin@marathonhub.com','$2b$10$1wY1DxOnz1FFQ8KSlk9qVOcHr8HJ/3W.5lQmxuk1Me4q3/1QSRjG6',NULL,NULL,NULL,0,'activo',NULL,NULL,'2026-10-30 06:32:35','2026-10-30 19:50:52'),(2,2,'Sofia','Cronometradora','staff@marathonhub.com','$2b$10$bO4zmgZi2tCfPRm.xzchLOSg3PZgObtu2hSnZoEi4YONaMZVm6UA6','+507 6000-0001',NULL,NULL,1,'activo','1994-05-12','F','2026-10-30 06:32:45','2026-10-30 08:10:54'),(3,3,'Carlos','Runner','corredor@marathonhub.com','$2b$10$cg24bescl2XYhbC9odQYce4Z/o49hRAJuSu4ihU1z.sOIBZYcVi3i',NULL,'Contacto de emergencia 555-0100','{}',1,'activo','1993-03-15','M','2026-10-30 06:32:45','2026-10-30 07:27:37'),(4,3,'Ana','Torres','ana.torres@example.com','$2b$10$cg24bescl2XYhbC9odQYce4Z/o49hRAJuSu4ihU1z.sOIBZYcVi3i',NULL,'Contacto de emergencia 555-0100',NULL,0,'activo','1990-07-21','F','2026-10-30 06:32:45','2026-10-30 06:32:45'),(5,3,'Luis','Gomez','luis.gomez@example.com','$2b$10$cg24bescl2XYhbC9odQYce4Z/o49hRAJuSu4ihU1z.sOIBZYcVi3i',NULL,'Contacto de emergencia 555-0100',NULL,0,'activo','1988-11-02','M','2026-10-30 06:32:45','2026-10-30 06:32:45'),(6,3,'Marta','Ruiz','marta.ruiz@example.com','$2b$10$cg24bescl2XYhbC9odQYce4Z/o49hRAJuSu4ihU1z.sOIBZYcVi3i',NULL,'Contacto de emergencia 555-0100',NULL,0,'activo','1988-01-30','F','2026-10-30 06:32:45','2026-10-30 06:32:45'),(7,3,'Pedro','Master','pedro.master@example.com','$2b$10$cg24bescl2XYhbC9odQYce4Z/o49hRAJuSu4ihU1z.sOIBZYcVi3i',NULL,'Contacto de emergencia 555-0100',NULL,0,'activo','1975-09-09','M','2026-10-30 06:32:45','2026-10-30 06:32:45'),(8,3,'Sofia','Veloz','sofia.veloz@example.com','$2b$10$cg24bescl2XYhbC9odQYce4Z/o49hRAJuSu4ihU1z.sOIBZYcVi3i',NULL,'Contacto de emergencia 555-0100',NULL,0,'activo','1995-12-05','F','2026-10-30 06:32:45','2026-10-30 06:32:45'),(9,3,'Jorge','Fondo','jorge.21k@example.com','$2b$10$cg24bescl2XYhbC9odQYce4Z/o49hRAJuSu4ihU1z.sOIBZYcVi3i',NULL,'Contacto de emergencia 555-0100',NULL,0,'activo','1982-04-18','M','2026-10-30 06:32:45','2026-10-30 06:32:45'),(10,3,'QA','Smoke','qa.smoke.1793346092629@example.com','$2b$10$0c9.7xYJa1qf8X26OXLEluutdNFkp1pyQ9LqM.JE/dZfX7OmaDwFO','+507 6000-9999','QA Contact +507 6000-1111',NULL,0,'inactivo','1990-01-01','M','2026-10-30 07:42:32','2026-10-30 07:42:43'),(11,3,'Adrian','Rios','adrianrios@gmail.com','$2b$10$r7CGgdX8QWxcLWAwUg.FPuhT1oTym3lMOHpyvl5itf4H9S2WPQxQq','1234567890','0123456789','{\"alergias\": \"Penicilina\", \"condiciones\": \"Ninguna\", \"tipo_sangre\": \"O+\"}',1,'activo','2006-10-10','M','2026-10-30 07:54:01','2026-10-30 08:06:29'),(12,3,'Randolfo','Santos Quiroz','rando.santos@utxicotepec.edu.mx','$2b$10$YS.wbS1KZNJ.lJEKaO79yOEUPoFE2nNiL11H8Hg95NGFkFOPMUXNS','7647647644','Ricardo Luna','{\"alergias\": \"A las granadas\", \"condiciones\": \"como potro salvaje\", \"tipo_sangre\": \"O+\"}',0,'activo','1965-02-28','M','2026-10-30 19:34:23','2026-10-30 19:37:25'),(13,1,'Ricardo','Luna Santos','ricardo.luna@utxicotepec.edu.mx','$2b$10$irHGB.qLSJuDMNvRAXHGEeYEl2/A1DMtneq7NSfIcZwEuG0kgG6D2','7647647744',NULL,NULL,0,'activo','2026-10-30','M','2026-10-30 19:44:27','2026-10-30 19:44:27');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'db_maraton_hub'
--

--
-- Dumping routines for database 'db_maraton_hub'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30 13:52:57
