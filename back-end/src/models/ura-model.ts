
export interface Ura {
    id: number,
    empresa_id: number,
    sub_grupo_id?: number,
    titulo: string,
    descricao: string,
    funcao: string,
    mensagem: string
}

const uras: Ura[] = [];

export const getUras = async () => {
    return uras;
}

export const getUraById = async (id: number) => {
    return uras.find(x => x.id == id);
}

export const getUrasByEmpresaId = async (empresa_id: number) => {
    return uras.filter(x => x.empresa_id == empresa_id);
}