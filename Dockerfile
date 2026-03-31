FROM nginx:alpine

# Copiar configuracion hiper-optimizada si se necesita, si no, alpine por defecto es ruteable #
# COPY nginx.conf /etc/nginx/nginx.conf

# Volcar la web estática #
COPY index.html /usr/share/nginx/html/
COPY estilo.css /usr/share/nginx/html/
COPY nous_engine.js /usr/share/nginx/html/

# Exponer el puerto para el M2
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
