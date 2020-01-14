let now = new Date;
let hora = now.getHours();
let minutos = now.getMinutes();
let segundos = now.getSeconds();
// let horaFunc = ''+hora+minutos+segundos+'';
let horaFunc = '13:00:5';
let hora_inicio = '08:55:00';
let hora_fim = '09:50:00';

hora_inicio = hora_inicio.split(':');
inicio_hora = hora_inicio[0];
inicio_minuto = hora_inicio[1];
console.log('hora server: ',hora);
console.log('minutos server: ',minutos);
console.log('inicio_hora ', parseInt(inicio_hora));
console.log('inicio_minuto ',inicio_minuto);

hora_fim = hora_fim.split(':');
fim_hora = hora_fim[0];
fim_minuto = hora_fim[1];
console.log('fim_hora: ',parseInt(fim_hora));
console.log('fim_minuto ',fim_minuto);

if (parseInt(hora) >= parseInt(inicio_hora)) {
    if (parseInt(hora) == parseInt(inicio_hora)) {
        if (parseInt(minutos) < parseInt(inicio_minuto)) {
            console.log('error minutos inicio');
            return ;
        }
    }

    if (parseInt(hora) <= parseInt(fim_hora)) {
        if (parseInt(hora) == parseInt(fim_hora)) {
            if (parseInt(minutos) > parseInt(fim_minuto)) {
                console.log('error minutos fim');
                return ;
            }
        }
    }
    console.log('deu certo');
    return ;
} else {
    console.log('error hora inicio');
    return ;
}



// console.log('horaFunc: ',horaFunc);
// console.log('hora_inicio: ',hora_inicio);
// console.log('hora_fim: ',hora_fim);

// horaFunc = (horaFunc.length == 4 ? horaFunc + '0' : horaFunc);
    
// if (horaFunc.substring(1, -1) == '0') horaFunc = horaFunc.substring(1, horaFunc.length);
// if (hora_inicio.substring(1, -1) == '0') hora_inicio = hora_inicio.substring(1, hora_inicio.length);
// if (hora_fim.substring(1, -1) == '0') hora_fim = hora_fim.substring(1, hora_fim.length);

// console.log('#############################################');
// console.log('horaFunc: ',horaFunc);
// console.log('hora_inicio: ',hora_inicio);
// console.log('hora_fim: ',hora_fim);

// if (parseInt(horaFunc) >= parseInt(hora_inicio) && parseInt(horaFunc) <= parseInt(hora_fim)) {
//     console.log('true horafunc');
//     return true;
// } else {
//     console.log('false horafunc');
//     return false;
// }
