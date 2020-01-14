
export const getDiaSemana = async () => {
    let dayName = new Array ("DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SABADO");
    let now = new Date;

    return dayName[now.getDay()];
}

export const getHoraFuncionamento = async (hora_inicio: string, hora_fim: string) => {
    let now = new Date;
    let hora = now.getHours();
    let minutos = now.getMinutes();
    let segundos = now.getSeconds();
    let horaFunc = ''+hora+minutos+segundos+'';

    let inicio_atual = hora_inicio.split(':');
    let inicio_hora = inicio_atual[0];
    let inicio_minuto = inicio_atual[1];
    
    let fim_atual = hora_fim.split(':');
    let fim_hora = fim_atual[0];
    let fim_minuto = fim_atual[1];

    if (hora >= parseInt(inicio_hora)) {
        if (hora == parseInt(inicio_hora)) {
            if (minutos < parseInt(inicio_minuto)) {
                return false;
            }
        }
    
        if (hora <= parseInt(fim_hora)) {
            if (hora == parseInt(fim_hora)) {
                if (minutos > parseInt(fim_minuto)) {
                    return false;
                }
            }
        }
        
        return true;
    } else {
        
        return false;
    }

    

    // if (horaFunc.length == 4) horaFunc = horaFunc + '0';
    // horaFunc = (horaFunc.length == 4 ? horaFunc + '00' : (horaFunc.length == 5 ? horaFunc + '0' : horaFunc));
    
    // if (horaFunc.substring(1, -1) == '0') horaFunc = horaFunc.substring(1, horaFunc.length);
    // if (hora_inicio.substring(1, -1) == '0') hora_inicio = hora_inicio.substring(1, hora_inicio.length);
    // if (hora_fim.substring(1, -1) == '0') hora_fim = hora_fim.substring(1, hora_fim.length);


    // if (parseInt(horaFunc) >= parseInt(hora_inicio) && parseInt(horaFunc) <= parseInt(hora_fim)) {
    //     // console.log('true horafunc');
    //     return true;
    // } else {
    //     // console.log('false horafunc');
    //     return false;
    // }
}