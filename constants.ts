import { Idol, TeamId } from './types';

export const IDOLS: Idol[] = [
  // Flamengo
  {
    id: 'zico',
    name: 'Zico',
    nickname: 'Galinho de Quintino',
    position: 'Meia',
    era: '1971-1989',
    teamId: TeamId.FLAMENGO,
    imageUrl: 'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTsNZiN7iPXiEuEzm4nG_QXv7Y9Y_1fK2KW83wSyTkN9vKZR1MDBrjM-ccqK_djGD5VJ4hutHNk-WEU_2g'
  },
  {
    id: 'adriano',
    name: 'Adriano',
    nickname: 'Imperador',
    position: 'Atacante',
    era: '2009-2010',
    teamId: TeamId.FLAMENGO,
    imageUrl: 'https://jpimg.com.br/uploads/2017/04/2003496921-fora-do-futebol-desde-2014-adriano-festejou-o-titulo-do-flamengo-na-copinha.jpg'
  },
  {
    id: 'arrascaeta',
    name: 'Arrascaeta',
    nickname: 'Arrasca',
    position: 'Meia',
    era: '2019-Presente',
    teamId: TeamId.FLAMENGO,
    imageUrl: 'https://admin.cnnbrasil.com.br/wp-content/uploads/sites/12/2025/12/arrascaeta-flamengo-cruz-azul-e1765567565693.jpg?w=1200&h=900&crop=0'
  },
  // Corinthians
  {
    id: 'socrates',
    name: 'Sócrates',
    nickname: 'Doutor',
    position: 'Meia',
    era: '1978-1984',
    teamId: TeamId.CORINTHIANS,
    imageUrl: 'https://veja.abril.com.br/wp-content/uploads/2016/06/socrates-corinthians-1985-original1.jpeg?quality=70&strip=info&w=383&w=636'
  },
  {
    id: 'neto',
    name: 'Neto',
    nickname: 'Craque Neto',
    position: 'Atacante',
    era: '1989-1994',
    teamId: TeamId.CORINTHIANS,
    imageUrl: 'https://medias.itatiaia.com.br/dims4/default/227ce5c/2147483647/strip/true/crop/1080x608+0+20/resize/1000x563!/quality/90/?url=https%3A%2F%2Fk2-prod-radio-itatiaia.s3.us-east-1.amazonaws.com%2Fbrightspot%2F22%2F54%2F7055d2a84465a1dc5eafc29415d2%2Fsaveclip-app-469273494-18468409027013496-7633333193090559718-n.jpg'
  },
  {
    id: 'memphis',
    name: 'Memphis Depay',
    nickname: 'Memphis',
    position: 'Atacante',
    era: '2024-Presente',
    teamId: TeamId.CORINTHIANS,
    imageUrl: 'https://conteudo.imguol.com.br/c/esporte/f0/2025/12/21/memphis-depay-do-corinthians-festeja-gol-sobre-o-vasco-na-final-da-copa-do-brasil-1766357609380_v2_450x450.jpg'
  }
];

export const TEAMS = {
  [TeamId.FLAMENGO]: {
    name: 'Flamengo',
    colors: 'from-red-900 to-black',
    accent: 'text-red-600',
    logo: 'CRF'
  },
  [TeamId.CORINTHIANS]: {
    name: 'Corinthians',
    colors: 'from-gray-900 to-black',
    accent: 'text-white',
    logo: 'SCCP'
  }
};