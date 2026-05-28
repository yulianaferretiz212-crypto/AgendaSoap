const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname)));

const contactos = [];

const servicioAgenda = {
    Agenda: {
        AgendaPort: {

      AgregarContacto: async function(args) {
        if (!args.nombre || !args.apellidos || !args.telefono || !args.correo) {
          throw {
            Fault: {
              faultcode: 'Client',
              faultstring: 'Todos los campos son obligatorios: nombre, apellidos, telefono y correo',
            }
          };
        }
        const existe = contactos.find(c => c.telefono === args.telefono);
        if (existe) {
          throw {
            Fault: {
              faultcode: 'Client',
              faultstring: 'Ya existe un contacto con el telefono ' + args.telefono,
            }
          };
        }
        contactos.push({
          nombre: args.nombre,
          apellidos: args.apellidos,
          telefono: args.telefono,
          correo: args.correo,
        });
        console.log('Contacto agregado:', args.nombre, args.apellidos);
        return { resultado: 'Contacto agregado correctamente' };
      },

      ObtenerContactos: async function(args) {
        console.log('Solicitud de lista de contactos. Total:', contactos.length);
        return { contactos: JSON.stringify(contactos) };
      },

      BuscarContacto: async function(args) {
        if (!args.telefono) {
          throw {
            Fault: {
              faultcode: 'Client',
              faultstring: 'El campo telefono es obligatorio para la busqueda',
            }
          };
        }
        const contacto = contactos.find(c => c.telefono === args.telefono);
        if (!contacto) {
          throw {
            Fault: {
              faultcode: 'Client',
              faultstring: 'No se encontro ningun contacto con el telefono ' + args.telefono,
            }
          };
        }
        console.log('Contacto encontrado:', contacto.nombre);
        return {
          nombre: contacto.nombre,
          apellidos: contacto.apellidos,
          telefono: contacto.telefono,
          correo: contacto.correo,
        };
      }

    }
  }
};

async function iniciar() {
  const rutaWsdl = path.join(__dirname, 'wsdl', 'agenda.wsdl');
  const wsdl = fs.readFileSync(rutaWsdl, 'utf8');
  const PUERTO = 3000;
  app.listen(PUERTO, () => {
    console.log('Servidor corriendo en puerto', PUERTO);
    soap.listen(app, '/agenda', servicioAgenda, wsdl, () => {
      console.log('Servicio SOAP listo');
      console.log('WSDL: http://localhost:3000/agenda?wsdl');
    });
  });
}

iniciar();