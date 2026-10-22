export const THEME_STORAGE_KEY = "passhunt-theme";

/** Skrypt uruchamiany przed renderem – bez „mignięcia” złego motywu. */
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
