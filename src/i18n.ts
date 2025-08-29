/**
 * Internationalization (i18n) configuration
 * Provides translations for English and Spanish
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

export const en = {
  // Navigation
  share: "Share",
  my_activity: "My Activity",
  ai_chat: "AI Chat",
  my_safety_plan: "My Safety Plan",
  community_feed: "Community Feed",
  wellness_videos: "Wellness Videos",
  assessments: "Assessments",
  crisis_resources: "Crisis Resources",
  peer_support: "Peer Support",
  reflections: "Reflections",
  tether: "Tether",
  quiet_space: "Quiet Space",
  group_sessions: "Group Sessions",
  helper_community: "Helper Community",
  helper_dashboard: "Helper Dashboard",
  admin_dashboard: "Admin Dashboard",
  moderation: "Moderation",
  analytics: "Analytics",
  profile: "Profile",
  settings: "Settings",
  donate: "Donate",

  // Common actions
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  submit: "Submit",
  close: "Close",
  open: "Open",
  view: "View",
  download: "Download",
  upload: "Upload",
  search: "Search",
  filter: "Filter",
  sort: "Sort",
  refresh: "Refresh",
  back: "Back",
  next: "Next",
  previous: "Previous",
  continue: "Continue",
  finish: "Finish",
  start: "Start",
  stop: "Stop",
  pause: "Pause",
  play: "Play",
  send: "Send",
  receive: "Receive",
  accept: "Accept",
  decline: "Decline",
  approve: "Approve",
  reject: "Reject",

  // Common labels
  name: "Name",
  email: "Email",
  password: "Password",
  username: "Username",
  phone: "Phone",
  address: "Address",
  city: "City",
  state: "State",
  country: "Country",
  zip_code: "Zip Code",
  date: "Date",
  time: "Time",
  status: "Status",
  type: "Type",
  category: "Category",
  description: "Description",
  title: "Title",
  content: "Content",
  message: "Message",
  comment: "Comment",
  rating: "Rating",
  score: "Score",
  level: "Level",
  priority: "Priority",
  tags: "Tags",

  // Status messages
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Information",
  loading: "Loading",
  saving: "Saving",
  saved: "Saved",
  deleted: "Deleted",
  updated: "Updated",
  created: "Created",
  completed: "Completed",
  pending: "Pending",
  active: "Active",
  inactive: "Inactive",
  enabled: "Enabled",
  disabled: "Disabled",

  // Time and dates
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
  this_week: "This Week",
  last_week: "Last Week",
  next_week: "Next Week",
  this_month: "This Month",
  last_month: "Last Month",
  next_month: "Next Month",

  // Accessibility
  accessibility: "Accessibility",
  high_contrast: "High Contrast",
  large_text: "Large Text",
  screen_reader: "Screen Reader",
  keyboard_navigation: "Keyboard Navigation"
};

export const es = {
  // Navigation
  share: "Compartir",
  my_activity: "Mi Actividad",
  ai_chat: "Chat IA",
  my_safety_plan: "Mi Plan de Seguridad",
  community_feed: "Feed de Comunidad",
  wellness_videos: "Videos de Bienestar",
  assessments: "Evaluaciones",
  crisis_resources: "Recursos de Crisis",
  peer_support: "Apoyo Entre Pares",
  reflections: "Reflexiones",
  tether: "Tether",
  quiet_space: "Espacio Silencioso",
  group_sessions: "Sesiones Grupales",
  helper_community: "Comunidad de Ayudantes",
  helper_dashboard: "Panel de Ayudante",
  admin_dashboard: "Panel de Administrador",
  moderation: "Moderación",
  analytics: "Analíticas",
  profile: "Perfil",
  settings: "Configuración",
  donate: "Donar",

  // Common actions
  save: "Guardar",
  cancel: "Cancelar",
  delete: "Eliminar",
  edit: "Editar",
  submit: "Enviar",
  close: "Cerrar",
  open: "Abrir",
  view: "Ver",
  download: "Descargar",
  upload: "Subir",
  search: "Buscar",
  filter: "Filtrar",
  sort: "Ordenar",
  refresh: "Actualizar",
  back: "Atrás",
  next: "Siguiente",
  previous: "Anterior",
  continue: "Continuar",
  finish: "Finalizar",
  start: "Iniciar",
  stop: "Detener",
  pause: "Pausar",
  play: "Reproducir",
  send: "Enviar",
  receive: "Recibir",
  accept: "Aceptar",
  decline: "Rechazar",
  approve: "Aprobar",
  reject: "Rechazar",

  // Common labels
  name: "Nombre",
  email: "Correo Electrónico",
  password: "Contraseña",
  username: "Nombre de Usuario",
  phone: "Teléfono",
  address: "Dirección",
  city: "Ciudad",
  state: "Estado",
  country: "País",
  zip_code: "Código Postal",
  date: "Fecha",
  time: "Hora",
  status: "Estado",
  type: "Tipo",
  category: "Categoría",
  description: "Descripción",
  title: "Título",
  content: "Contenido",
  message: "Mensaje",
  comment: "Comentario",
  rating: "Calificación",
  score: "Puntuación",
  level: "Nivel",
  priority: "Prioridad",
  tags: "Etiquetas",

  // Status messages
  success: "Éxito",
  error: "Error",
  warning: "Advertencia",
  info: "Información",
  loading: "Cargando",
  saving: "Guardando",
  saved: "Guardado",
  deleted: "Eliminado",
  updated: "Actualizado",
  created: "Creado",
  completed: "Completado",
  pending: "Pendiente",
  active: "Activo",
  inactive: "Inactivo",
  enabled: "Habilitado",
  disabled: "Deshabilitado",

  // Time and dates
  today: "Hoy",
  yesterday: "Ayer",
  tomorrow: "Mañana",
  this_week: "Esta Semana",
  last_week: "Semana Pasada",
  next_week: "Próxima Semana",
  this_month: "Este Mes",
  last_month: "Mes Pasado",
  next_month: "Próximo Mes",

  // Accessibility
  accessibility: "Accesibilidad",
  high_contrast: "Alto Contraste",
  large_text: "Texto Grande",
  screen_reader: "Lector de Pantalla",
  keyboard_navigation: "Navegación por Teclado"
};

export type Language = 'en' | 'es';
export type TranslationKey = keyof typeof en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  defaultLanguage = 'en' 
}) => {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  const t = (key: TranslationKey): string => {
    const translations = language === 'es' ? es : en;
    return translations[key] || key;
  };

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t
  };

  return React.createElement(
    I18nContext.Provider,
    { value: contextValue },
    children
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Default export
export default {
  en,
  es
};