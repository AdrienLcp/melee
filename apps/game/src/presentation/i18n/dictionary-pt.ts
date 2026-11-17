import {
  defineDictionary,
  defineTranslation,
  type MatchingDictionary
} from '@adrienlcp/i18n'

import { COUNTRY_NAMES_PT } from '@melee/core/countries/country-names-pt'

import type { EN_DICTIONARY } from './dictionary-en'

/**
 * European Portuguese, addressed as _tu_.
 *
 * The dictionary is registered as `pt`, and CLDR reads `pt` with Brazil's
 * plural rule, where 0 is singular. Portugal says _0 pontos_, so every count
 * that inflects declares a `zero` form that reads as the plural.
 */
const PORTUGUESE = defineDictionary({
  /** The back office at `/admin`: live rooms and error reports, read by the site's owner alone. */
  admin: {
    ago: {
      days: defineTranslation('{when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'day' } }
      }),
      hours: defineTranslation('{when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'hour' } }
      }),
      minutes: defineTranslation('{when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'minute' } }
      })
    },
    detail: {
      close: 'Voltar à lista',
      context: 'Contexto',
      failed: 'Não foi possível carregar este relatório.',
      frames: 'Últimas mensagens',
      noFrames: 'Nenhuma mensagem guardada',
      noStack: 'Sem pilha',
      received: 'Recebida',
      sent: 'Enviada',
      stack: 'Pilha'
    },
    key: {
      label: 'Chave de administração',
      refused: 'Esta chave não abre nada aqui.',
      submit: 'Abrir',
      unreachable: 'O servidor não responde.'
    },
    reports: {
      any: 'Todos',
      empty: 'Nenhum relatório',
      emptyDetail: 'Alarga o período ou retira um filtro.',
      filters: {
        browser: 'Navegador',
        build: 'Versão',
        game: 'Jogo',
        kind: 'Tipo',
        room: 'Código da mesa',
        since: 'Desde'
      },
      more: 'Relatórios mais antigos',
      noMessage: 'Sem mensagem',
      windows: {
        day: '24 horas',
        hour: '1 hora',
        month: '30 dias',
        week: '7 dias'
      }
    },
    rooms: {
      closed: 'Fechada',
      empty: 'Nenhuma mesa aberta',
      emptyDetail: 'Esta lista atualiza-se a cada dez segundos.',
      moved: 'mexida {when}',
      noGame: 'Nenhum jogo escolhido',
      opened: 'aberta {when}',
      round: 'Ronda {n:number}',
      seats: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} lugar',
            other: '{?} lugares',
            zero: '{?} lugares'
          }
        }
      }),
      walls: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} ecrã da sala',
            other: '{?} ecrãs da sala',
            zero: '{?} ecrãs da sala'
          }
        }
      })
    },
    title: 'Bastidores',
    unreachable: {
      detail: 'Verifica a ligação e tenta outra vez.',
      retry: 'Tentar outra vez',
      retrying: 'Nova tentativa a cada dez segundos.',
      title: 'Servidor inacessível'
    },
    views: {
      label: 'Vista',
      reports: 'Relatórios',
      rooms: 'Mesas a decorrer'
    }
  },
  assistant: {
    address: {
      copy: 'Copiar o endereço',
      heading: 'Copia o endereço',
      note: 'Sem conta nem chave: basta o endereço.'
    },
    ask: {
      copy: 'Copiar o exemplo',
      example:
        'Prepara duas horas de jogos para uma família com crianças pequenas, sem nada que o anfitrião tenha de decidir.',
      heading: 'Pede por palavras tuas',
      note: 'Diz quem está à mesa, por quanto tempo e o que deixar de fora.',
      ownQuiz: {
        copy: 'Copiar o quiz da família',
        example:
          'Escreve um quiz de dez perguntas sobre a nossa família — eu falo-te de nós — e põe-no a abrir uma hora de jogos.',
        note: 'O link tem todas as respostas: abre-o tu, em vez de o mandares à mesa.'
      }
    },
    connect: {
      claude: {
        name: 'Claude',
        steps:
          'Configurações → Conectores → Adicionar conector personalizado e, de seguida, cola o endereço.'
      },
      claudeCode: {
        command: 'claude mcp add --transport http melee {url}',
        copy: 'Copiar o comando',
        name: 'Claude Code'
      },
      heading: 'Adiciona-o ao teu assistente',
      other: {
        name: 'Outro assistente',
        steps:
          'Qualquer assistente que aceite um servidor MCP remoto: dá-lhe o endereço como Streamable HTTP.'
      }
    },
    intro:
      'Um assistente de IA como o Claude pode montar a partida por ti: conhece todos os jogos da prateleira e devolve um link que a abre pronta a jogar.',
    outcome:
      'Responde com um link. Abre-o no ecrã que vai conduzir a mesa: a partida fica lá montada, pronta para abrir uma mesa ou para guardar entre as tuas.',
    title: 'Preparar com um assistente'
  },
  atlas: {
    answer: {
      cancel: 'Cancelar',
      confirm: 'Pôr aqui',
      sent: 'O teu peão está pousado. À espera dos outros.'
    },
    asks: {
      name: 'Nomear {places} no mapa',
      place: 'Encontrar {places}',
      places: {
        countries: 'um país',
        frenchCities: 'uma cidade francesa',
        worldCapitals: 'uma capital'
      }
    },
    country: COUNTRY_NAMES_PT,
    direction: {
      label: 'A ronda pede',
      name: 'Nomear o local assinalado no mapa',
      place: 'Pôr no mapa o local nomeado'
    },
    home: {
      description:
        'Aparece um país, uma capital ou uma cidade francesa, e toda a gente pousa um peão num mapa que se amplia com os dedos: em cima, conta por inteiro; fora, paga-se ao quilómetro. Na revelação, cada peão traça a sua linha até ao local. Ou ao contrário: o mapa assinala um local, e a mesa diz o nome.'
    },
    map: {
      hint: 'Amplia e pousa o teu peão em cima',
      label: 'Mapa do mundo',
      labelFrance: 'Mapa de França',
      loading: 'A desdobrar o mapa…',
      moveHint: 'Toca noutro sítio para o mudar',
      whole: 'O mundo inteiro',
      wholeFrance: 'Toda a França',
      zoomIn: 'Ampliar',
      zoomOut: 'Reduzir'
    },
    name: 'Atlas',
    naming: {
      capital: 'Que capital é esta?',
      city: 'Que cidade é esta?',
      country: 'Que país é este?'
    },
    places: {
      countries: 'Países do mundo',
      frenchCities: 'Cidades de França',
      label: { name: 'Para nomear', place: 'Para situar' },
      worldCapitals: 'Capitais do mundo'
    },
    play: 'Jogar Atlas',
    prompt: 'Situa {place}',
    reveal: {
      away: 'a {distance} km',
      capitalOf: '{capital}, {country}',
      capitalTitle: 'A capital:',
      cityTitle: 'A cidade:',
      inside: 'Dentro',
      km: '{distance} km',
      onTheSpot: 'Em cheio',
      title: 'O país:'
    },
    roundDuration: 'Tempo por ronda',
    scoring:
      'Toda a gente pousa o peão ao mesmo tempo. Dentro do país vale 100 pontos, e cada vez menos até nada a 1500 km da fronteira — quanto mais perto, mais vale.',
    scoringCapitals:
      'Toda a gente pousa o peão ao mesmo tempo. A menos de 100 km da capital vale 100 pontos, e cada vez menos até nada a 1000 km.',
    scoringCities:
      'Toda a gente pousa o peão ao mesmo tempo, num mapa de França. A menos de 25 km da cidade vale 100 pontos, e cada vez menos até nada a 150 km.',
    scoringMixed:
      'Toda a gente pousa o peão ao mesmo tempo — um país, uma capital ou uma cidade francesa, conforme a ronda. Quanto mais perto o teu peão, mais vale, até 100 pontos.',
    scoringName: {
      choice:
        'O mapa mostra um local e propõe quatro nomes, a toda a gente ao mesmo tempo. O certo vale 100 pontos.',
      typed:
        'O mapa mostra um local e toda a gente escreve o nome ao mesmo tempo. O nome certo vale 100 pontos.'
    },
    tagline: 'Um local. Pousa o teu peão em cima, ou diz o nome.'
  },
  blacksquare: {
    answer: {
      found: '«{line}»: encontrada',
      label: 'Uma resposta',
      miss: '«{line}»: nada',
      retry: 'As que quiseres. Uma delas é a palavra negra.'
    },
    answerCount: {
      label: 'Respostas a encontrar',
      summary: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} resposta',
            other: '{?} respostas',
            zero: '{?} respostas'
          }
        }
      })
    },
    blackWord: {
      ends: 'A tua ronda acaba aqui. Não vale nada.',
      fell: '<name>{nickname}</name> caiu nela e perdeu a ronda',
      nobodyFell: 'Ninguém caiu nela',
      stamp: 'Palavra negra'
    },
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} tema caseiro',
            other: '{?} temas caseiros',
            zero: '{?} temas caseiros'
          }
        }
      }),
      spent: 'Temas caseiros esgotados'
    },
    duration: 'Tempo por ronda',
    found: defineTranslation('{count:plural}', {
      plural: {
        count: {
          one: '{?} de {total:number} encontrada pela mesa',
          other: '{?} de {total:number} encontradas pela mesa',
          zero: '{?} de {total:number} encontradas pela mesa'
        }
      }
    }),
    grid: 'As respostas',
    home: {
      description:
        'Sai um tema — os filmes de Quentin Tarantino, os países que fazem fronteira com a França — e quatro respostas escondem-se atrás dele — até nove, se quiseres —, as menos óbvias a valer mais. Toda a gente dispara respostas do seu ecrã, quantas quiser. Escondida entre elas está uma palavra negra: uma resposta que parece certa e não é, e quem cair nela perde a ronda.'
    },
    lone: {
      doubled: '×2',
      hint: 'Uma resposta que só um jogador encontra vale a dobrar.',
      label: 'Mais ninguém a encontrou',
      said: 'Mais ninguém a encontrou, por isso valeu a dobrar'
    },
    name: 'Casa negra',
    nobody: 'Ninguém',
    othersLooking: 'Os outros ainda procuram.',
    play: 'Jogar Casa negra',
    scoring:
      'Há respostas escondidas, e a grelha vale 100 pontos repartidos entre elas: uma óbvia conta uma parte, uma menos conhecida duas, uma rara três. Cai na palavra negra e a tua ronda não vale nada.',
    scoringLoneFinds:
      'Há respostas escondidas, e a grelha vale 100 pontos repartidos entre elas: uma óbvia conta uma parte, uma menos conhecida duas, uma rara três, e uma resposta que mais ninguém encontra conta a dobrar — a grelha continua a valer 100 no máximo. Cai na palavra negra e a tua ronda não vale nada.',
    scoringSpoken:
      'Uma equipa diz as respostas em voz alta e alguém de outra equipa vai-as marcando. A grelha vale 100 pontos repartidos entre as suas respostas: uma óbvia conta uma parte, uma menos conhecida duas, uma rara três. Se a palavra negra for dita, a ronda da equipa não vale nada.',
    spoken: {
      blackWord: {
        ask: 'Disseram-na? A ronda deles acaba e não vale nada.',
        confirm: 'Disseram-na',
        keep: 'Não disseram'
      },
      guessing: 'Em voz alta: <name>{team}</name>',
      hidden: 'Escondida: podes mostrar o ecrã sem revelar nada.',
      hide: 'Esconder a lista',
      keep: 'Tens a lista de <name>{team}</name>. Marca cada resposta que ouvires.',
      keeper: '<name>{nickname}</name> tem a lista',
      show: 'Ver a lista',
      yourTeam:
        'Digam as vossas respostas em voz alta. <name>{nickname}</name> marca-as.'
    },
    tagline: 'Respostas escondidas. Uma palavra negra.',
    /** A cell's tier said aloud, where the pips show it and the sheet's pay is the seat's own figure. */
    tierOf: 'Nível {tier:number} de {most:number}',
    yours: 'Encontraste-a'
  },
  blindtest: {
    answer: {
      anyOrder:
        'O título, o artista, ou os dois — quantas tentativas quiseres.',
      anyOrderFilm:
        'O filme, o compositor, ou os dois — quantas tentativas quiseres.',
      artistFound: 'Artista ✓',
      bothFound: 'Já tens os dois. Relaxa.',
      composerFound: 'Compositor ✓',
      filmFound: 'Filme ✓',
      titleFound: 'Título ✓'
    },
    /**
     * The one screen in the product that admits to being silent. A console that
     * reloaded mid-round never asked the browser for permission, and nothing on
     * the screen would otherwise say so.
     */
    audio: {
      /**
       * What the last press got. Without these the offer above repeats itself
       * for the whole evening and nothing on the screen ever says that every
       * press has already failed.
       *
       * `blocked` names the site's sound permission rather than saying "try
       * again", because the press behind it is always a real gesture — both
       * `unlock()` call sites are synchronous inside `onPress` — so a
       * `NotAllowedError` here is a setting rather than a mistimed press, and
       * pressing again answers it identically for the rest of the evening.
       *
       * All three end on the same way out, so a console that cannot be fixed
       * where it stands is told once what to do instead of three times what
       * went wrong.
       */
      /**
       * A clip the speaker was allowed to play and could not: the file, never
       * the screen, so nothing here asks for a press.
       */
      fault: {
        stalled:
          'A música ficou presa a carregar aqui. Verifica a ligação deste ecrã.',
        unreachable:
          'A música não carrega aqui. Um bloqueador de anúncios, a proteção contra rastreio do navegador ou um filtro de rede costuma bloqueá-la: autoriza este site, ou revela esta música e passa à seguinte.'
      },
      /**
       * Told to the console about the room’s screen, which is the one sounding
       * and the one the host is not looking at.
       */
      onWall: {
        blocked:
          'O ecrã da sala fica mudo até alguém carregar lá em Ligar o som.',
        stalled:
          'A música ficou presa a carregar no ecrã da sala. Revela esta música e passa à seguinte, ou verifica a ligação desse ecrã.',
        unreachable:
          'O ecrã da sala não consegue carregar a música. Um bloqueador de anúncios, a proteção contra rastreio do navegador ou um filtro de rede costuma bloqueá-la lá: autoriza este site nesse ecrã, ou revela esta música e passa à seguinte.'
      },
      pause: 'Pausa',
      playing: 'A música toca aqui agora.',
      refused: {
        blocked:
          'O navegador recusou o som. Autoriza-o para este site, ou conduz a mesa a partir de outro ecrã.',
        broken:
          'Algo falhou do nosso lado. Tenta outra vez, ou conduz a mesa a partir de outro ecrã.',
        unsupported:
          'Este ecrã não consegue tocar o excerto. Conduz a mesa a partir de outro ecrã.'
      },
      replay: 'Do início',
      resume: 'Retomar',
      silent: 'Não sai som daqui.',
      start: 'Ligar o som'
    },
    clip: 'Duração do excerto',
    decade: {
      '1970s': 'Anos 70',
      '1980s': 'Anos 80',
      '1990s': 'Anos 90',
      '2000s': 'Anos 2000',
      '2010s': 'Anos 2010',
      '2020s': 'Anos 2020',
      label: 'Que anos',
      none: 'Se não escolheres nenhuma, tens todas as décadas.'
    },
    genre: {
      '52': 'Canção francesa',
      '106': 'Eletrónica',
      '113': 'Dance',
      '116': 'Rap e hip-hop',
      '129': 'Jazz',
      '132': 'Pop',
      '144': 'Reggae',
      '152': 'Rock',
      '165': 'R&B',
      '169': 'Soul e funk',
      '197': 'Latina',
      '464': 'Metal',
      label: 'Que música',
      none: 'Se não escolheres nenhum, tens todos os géneros.'
    },
    home: {
      description:
        'Às vezes bastam três notas, e a mesa inteira já anda à procura. Título, artista, ou os dois: quem souber primeiro leva a ronda.'
    },
    listening: 'A ouvir…',
    name: 'Adivinha a música',
    play: 'Jogar Adivinha a música',
    reveal: {
      title: 'Era'
    },
    scoring: {
      buzzer:
        'Quem tocar primeiro responde em voz alta. O anfitrião decide o título e o artista, 40 pontos cada e 100 pelos dois — uma resposta errada deixa-te fora da ronda até ao fim.',
      choice:
        'Quatro respostas sobre o mesmo excerto, toda a gente ao mesmo tempo. A certa vale 100 pontos.',
      typed:
        'Toda a gente escreve, sobre o mesmo excerto. Título ou artista sozinho vale 40 pontos, e os dois juntos valem 100.'
    },
    scoringFilm: {
      buzzer:
        'Quem tocar primeiro responde em voz alta. O anfitrião decide o filme e o compositor, 40 pontos cada e 100 pelos dois — uma resposta errada deixa-te fora da ronda até ao fim.',
      typed:
        'Toda a gente escreve, sobre o mesmo excerto. Filme ou compositor sozinho vale 40 pontos, e os dois juntos valem 100.'
    },
    scoringMixed: {
      buzzer:
        'Quem tocar primeiro responde em voz alta: o título e o artista, ou o filme e o compositor quando é música de cinema. O anfitrião decide cada um, 40 pontos cada e 100 pelos dois — uma resposta errada deixa-te fora da ronda até ao fim.',
      typed:
        'Toda a gente escreve, sobre o mesmo excerto: o título e o artista, ou o filme e o compositor quando é música de cinema. Um dos dois sozinho vale 40 pontos, e os dois juntos valem 100.'
    },
    source: {
      catalogue: 'O catálogo',
      chart: 'Os tops',
      decades: 'As décadas',
      film: 'Música de cinema',
      filmHint:
        'O que um compositor escreveu para um filme ou uma série — não as canções da banda sonora.',
      label: 'De onde vêm as músicas',
      noneInPlaylist:
        'Nada que se possa tocar nessa playlist. Verifica o identificador.',
      noneInSearch:
        'Nada suficientemente conhecido corresponde. Tenta outra pesquisa.',
      playlist: 'Uma playlist Deezer',
      playlistId: 'Identificador da playlist',
      playlistIdHint: 'O número no fim do endereço Deezer da playlist.',
      preview: 'Ver o que dá',
      query: 'Pesquisar',
      queryHint: 'A tua pesquisa vai para o Deezer, que encontra as músicas.',
      ready: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} música pronta',
            other: '{?} músicas prontas',
            zero: '{?} músicas prontas'
          }
        }
      }),
      search: 'Uma pesquisa',
      strands: 'De onde tira',
      wholeCatalogue: 'O catálogo inteiro'
    },
    tagline: 'Acerta na música antes de toda a gente.',
    verdict: {
      artistOnly: 'Só o artista',
      both: 'Título + artista',
      bothFilm: 'Filme + compositor',
      composerOnly: 'Só o compositor',
      filmOnly: 'Só o filme',
      miss: 'Errado',
      titleOnly: 'Só o título'
    }
  },
  board: {
    at: 'Casa {case:number}',
    back: 'Fazer {team} recuar uma casa',
    case: 'Casa {case:number} de {length:number}',
    finish: 'Chegada',
    fix: 'Corrigir as casas',
    forward: 'Fazer {team} avançar uma casa',
    /** Under the whole track, on a screen in the hand when no wall draws the race. */
    lead: {
      ahead: defineTranslation('À frente por {gap:plural}', {
        plural: {
          gap: { one: '{?} casa', other: '{?} casas', zero: '{?} casas' }
        }
      }),
      behind: defineTranslation(
        '<name>{leader}</name> à frente, por {gap:plural}',
        {
          plural: {
            gap: { one: '{?} casa', other: '{?} casas', zero: '{?} casas' }
          }
        }
      ),
      level: 'Empate na frente'
    },
    more: '+{count:number}',
    points: 'Aos pontos',
    recentre: 'Recentrar',
    setting: {
      catchUp: {
        hint: 'Quem estiver sozinho no último lugar avança mais uma casa numa ronda em que pontue.',
        label: 'Ajudar o último'
      },
      /** The lobby's board preview, which opens the setup on the board's strip. */
      hint: {
        points: 'Pontos em cada ecrã: o maior total ganha.',
        seats:
          'Sem pontos: um peão por jogador num percurso, que avança a cada ronda.',
        teams:
          'Sem pontos: um peão por equipa num percurso, que avança a cada ronda.'
      },
      label: 'Joga-se',
      points: 'Aos pontos',
      strategy: {
        hint: {
          onePointOneCase:
            'Uma resposta certa avança 3 casas; em parte certa, uma a menos. A rapidez nunca conta.',
          rank: 'O melhor da ronda avança 3 casas, o segundo 2, o terceiro 1.'
        },
        label: 'Os peões avançam',
        onePointOneCase: 'Pela resposta',
        rank: 'Pela classificação'
      },
      /** Under each length on the board's strip, which prints the number alone. */
      unit: 'casas'
    },
    standing: '{team}: casa {case:number} de {length:number}',
    start: 'Partida',
    summary: 'um tabuleiro de {length:number} casas',
    walked: '+{count:number}',
    /** What the round walked a seat's pawn, on the round's podium. */
    walkedSquares: defineTranslation('{count:plural}', {
      plural: {
        count: { one: '+{?} casa', other: '+{?} casas', zero: '+{?} casas' }
      }
    }),
    /** Beside the figure a seat's own round token prints alone: what it counts. */
    walkedUnit: defineTranslation('{count:plural}', {
      plural: { count: { one: 'casa', other: 'casas', zero: 'casas' } }
    })
  },
  buzz: {
    action: 'Tocar',
    blocked: {
      host_away: 'O anfitrião ausentou-se. Está tudo em pausa.',
      round_not_running: 'À espera do anfitrião',
      someone_else_buzzed: 'Alguém foi mais rápido',
      you_already_missed: 'Estás fora desta ronda',
      your_answer_is_pending: 'Diz a tua resposta em voz alta'
    },
    ready: 'Toca assim que souberes',
    sendFailed: 'O toque não chegou. Toca outra vez.',
    theyBuzzed: '<name>{nickname}</name> tocou',
    won: 'É a tua vez. Di-lo em voz alta'
  },
  buzzer: {
    clearLockouts: 'Pôr toda a gente em jogo',
    home: {
      description:
        'As perguntas trazes tu — uma charada, um quiz numa folha, uma lição, o que a mesa quiser. Aqui só se decide uma coisa: quem foi o mais rápido. E isso nunca está em dúvida.'
    },
    lockout: 'Uma resposta errada deixa-te fora',
    name: 'Campainha',
    play: 'Jogar à Campainha',
    running: 'Faz a tua pergunta',
    scoring:
      'O mais rápido responde em voz alta, e o anfitrião diz se está certo. 100 pontos se estiver — e uma resposta errada deixa-te fora até o anfitrião te pôr de novo em jogo.',
    tagline: 'As tuas perguntas, e uma corrida à campainha.'
  },
  challenge: {
    atTheTable: 'Joga-se à mesa — o anfitrião anuncia a classificação.',
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} desafio caseiro',
            other: '{?} desafios caseiros',
            zero: '{?} desafios caseiros'
          }
        }
      }),
      spent: 'Desafios caseiros esgotados'
    },
    hand: {
      aloud: 'Digo-o em voz alta',
      own: 'O teu desafio',
      spent: 'O banco esgotou-se: escreve o desafio, ou di-lo em voz alta.',
      write: 'Escrever o meu',
      writePlaceholder: 'Ou escreve o teu…'
    },
    home: {
      description:
        'Cortar um legume em duas metades com o mesmo peso, empilhar o maior número de batatas: o desafio joga-se à mesa, longe dos ecrãs. O anfitrião mostra-o no ecrã da sala, diz quem ficou em primeiro, segundo e terceiro, e os pontos entram na classificação como os de qualquer ronda.'
    },
    line: {
      aloud: 'Se ficar vazio, dizes-o em voz alta.',
      description:
        'Se ficar vazio, joga-se o desafio mostrado — ou escreve o teu.',
      label: 'O desafio',
      redeal: 'Tirar outro desafio'
    },
    name: 'Desafio',
    own: {
      add: 'Adicionar',
      description:
        'Jogados antes do banco, por esta ordem, mesmo numa ronda que arranca sozinha. Guardados neste ecrã.',
      field: 'Desafio {index:number}',
      new: 'Um novo desafio',
      newPlaceholder: 'Escreve um desafio…',
      played: 'Jogado',
      remove: 'Remover o desafio {index:number}',
      summary: '{count:number} por vir',
      title: 'Os teus desafios'
    },
    places: {
      confirm: 'Confirmar a classificação',
      first: '1.º',
      label: 'Classificação',
      nobody: 'Ninguém ganha',
      none: '—',
      second: '2.º',
      third: '3.º'
    },
    play: 'Jogar ao Desafio',
    scoring:
      'Joga-se à mesa. O anfitrião classifica os três primeiros: 100 pontos para o primeiro, 67 para o segundo, 33 para o terceiro — um empate partilha o lugar.',
    tagline: 'Joga-se à mesa, conta para a classificação.',
    untitled: 'Um desafio à mesa'
  },
  connection: {
    closed: 'A voltar a ligar…',
    connecting: 'A ligar…',
    latency: '· {milliseconds:number} ms',
    open: 'Ligado',
    refused: 'Desligado'
  },
  /**
   * These three sentences are not blurb. CC BY-SA 4.0 §3(a)(1)(B) asks that a
   * modification be indicated, and it is the one item on that list owed
   * whatever the upstream supplied — so each has to stay true to what the
   * ingestion in `apps/server/scripts/` actually does to that bank.
   */
  credits: {
    enable:
      'As suas palavras de duas a nove letras foram mantidas, escritas em maiúsculas, como todas as palavras que um jogador pode tentar em inglês.',
    flagIcons:
      'Cada bandeira é desenhada tal como é distribuída, renomeada a partir do seu próprio desenho e não do seu país, e o código do país escrito em cada ficheiro foi substituído, para que o ficheiro enviado a um ecrã nada diga da resposta. Sete bandeiras desenhadas exatamente como a de outro país foram deixadas de fora.',
    lexique:
      'Cada forma foi escrita nas maiúsculas de A a Z — sem acentos, Œ e Æ escritos com duas letras — e as que tinham um hífen, um apóstrofo ou um espaço foram deixadas de fora, tal como as de menos de duas letras ou de mais de nove. As palavras a descobrir são tiradas dos seus nomes, adjetivos e infinitivos de cinco a oito letras, ordenados pela frequência com que os filmes os dizem, sem palavras grosseiras nem algumas outras que uma revisão considerou impróprias.',
    licences: {
      publicDomain: 'Domínio público',
      scowl: 'Licença SCOWL'
    },
    mintaka:
      'Fornece perguntas e nenhuma resposta errada: as três opções ao lado de cada resposta certa foram construídas aqui, a partir de entidades que o Wikidata classifica no mesmo tipo que a resposta e que são lidas mais ou menos tanto quanto ela em francês. Cinco das suas oito rubricas foram mantidas e associadas aos temas usados aqui, tal como quatro das suas nove formas de pergunta — as outras nomeiam as suas próprias opções na pergunta, aceitam mais respostas do que registam, ou perguntam em dois passos. As perguntas que nomeiam o presente foram deixadas de fora, por o corpus estar fixado em outubro de 2021. Do que restou, só entraram no banco aquelas cuja resposta e cujo tema têm um artigo da Wikipédia em francês que as pessoas realmente leem, e nenhuma resposta aparece mais de cinco vezes num mesmo tema.',
    mmmlu:
      'Uma tradução profissional para francês do MMLU, um teste de referência e não um quiz, filtrada para cultura geral: só foram mantidos os temas que uma mesa pode jogar e, dentro deles, só as perguntas que uma revisão considerou ao alcance de uma mesa. Algumas perguntas foram reformuladas ou corrigidas e algumas respostas erradas substituídas.',
    openquizzdb:
      'As suas rubricas foram associadas aos temas usados aqui, as suas curiosidades mantidas como a linha mostrada quando a resposta é pública, e as suas perguntas para adultos marcadas para que o anfitrião as possa deixar de fora. As perguntas que não tinham exatamente três respostas erradas foram deixadas de fora, tal como aquelas cujas respostas erradas não se distinguem da certa depois de escritas. Uma resposta escrita de forma diferente da sua própria curiosidade foi corrigida.',
    opentdb:
      'O seu texto chega codificado em HTML e foi descodificado, as suas categorias foram associadas aos temas usados aqui, e as perguntas que não tinham exatamente três respostas erradas foram deixadas de fora, tal como aquelas cujas respostas erradas não se distinguem da certa depois de escritas.',
    polyfact:
      'É construído a partir do Wikidata em catorze formas de pergunta, e sete delas foram mantidas e associadas aos temas usados aqui — as outras perguntam sobre aldeias de que ninguém ouviu falar, ou revelam a resposta na pergunta. Do que restou, só entraram no banco as perguntas cujo tema e cujas quatro opções têm todos um artigo da Wikipédia em francês que as pessoas realmente leem. Uma resposta errada a que a fonte recorria demasiadas vezes foi trocada por outra que quase não usava, e as perguntas cujas respostas erradas não se distinguem da certa depois de escritas foram deixadas de fora.',
    scowl:
      'Os seus três tamanhos mais pequenos dão as palavras a descobrir em inglês: as de cinco a oito letras, em minúsculas e presentes no ENABLE, nunca uma forma flexionada, sem as suas próprias listas de insultos e palavrões nem algumas outras que uma revisão considerou impróprias. O tamanho de onde vem uma palavra diz a sua dificuldade.',
    shareAlike:
      'O banco montado é partilhado sob a mesma licença, e o código que o monta é aberto.',
    title: 'Créditos',
    vikidia:
      'Os seus quizzes estão escritos em wikitexto e foram lidos linha a linha para tirar uma pergunta, uma resposta e três respostas erradas. Cada uma das suas páginas foi associada à mão a um dos temas usados aqui, por a wiki não ter rubricas; as que falam da própria wiki foram deixadas de fora. As perguntas com menos de quatro opções, as que têm várias respostas certas e aquelas que dependem de uma fórmula matemática, de código ou de uma imagem foram deixadas de fora. As predefinições que traziam uma unidade ou uma citação foram substituídas pelo que mostram. Cada pergunta mantida foi lida uma vez: as falsas foram retiradas, as que já não nomeavam o seu próprio tema foram completadas, e as que só se ganham escolhendo foram marcadas.',
    whatChanged: 'O que mudámos'
  },
  error: {
    already_buzzed: 'Alguém foi mais rápido.',
    api: {
      rate_limited: 'São muitas mesas. Espera um minuto e tenta outra vez.',
      rejected: 'Isso não passou. Tenta outra vez.',
      unexpected_response:
        'Não soubemos o que fazer com isso. Tenta outra vez.',
      unreachable: 'Não conseguimos chegar ao Mêlée. Tenta daqui a pouco.'
    },
    colour_still_shown: 'Espera que a cor desapareça antes de enviares a tua.',
    colour_taken: 'Alguém acabou de ficar com essa peça — escolhe outra.',
    false_start: 'Cedo demais. Espera que mude.',
    host_already_connected: 'Alguém já está a conduzir esta mesa.',
    host_away: 'O anfitrião ausentou-se. A ronda fica à espera.',
    host_only_action: 'Só o anfitrião pode fazer isso.',
    host_reconnecting:
      'Esta mesa acabou de perder o anfitrião e está à espera que volte.',
    internal_error: 'Algo falhou do nosso lado. Tenta outra vez.',
    invalid_calculation:
      'Essas peças não dão isso: uma peça usada duas vezes, uma subtração abaixo de um ou uma divisão com resto.',
    invalid_message: 'Não percebemos. Tenta outra vez.',
    joined_mid_round: 'Jogas a partir da próxima ronda.',
    judging_round: 'Estás a julgar esta ronda, e voltas a jogar na próxima.',
    letter_not_in_draw:
      'Essa palavra leva uma letra que não saiu, ou mais vezes do que saiu.',
    music_source_unavailable:
      'O Deezer, de onde vem a música, não responde. Não são as tuas colunas: tenta daqui a pouco.',
    nickname_taken: 'Esse nome já está ocupado.',
    no_content_available: 'Não resta nada para jogar. Muda as definições.',
    no_game_chosen: 'Escolhe primeiro um jogo.',
    not_in_dictionary:
      'Essa palavra não está no dicionário. Não conta como tentativa.',
    not_one_word: 'Uma só palavra, só letras. Não conta como tentativa.',
    not_your_turn: 'Esta ronda é um duelo entre dois outros jogadores.',
    pairing_not_found:
      'Esse código de ecrã expirou. Abre o ecrã outra vez para ter um novo.',
    player_locked_out: 'Estás fora desta ronda.',
    protocol_version_mismatch: 'Esta página está desatualizada. Recarrega-a.',
    rate_limited: 'São muitas mesas. Espera um minuto e tenta outra vez.',
    removed_by_host: 'O anfitrião tirou-te da mesa.',
    room_closed: 'O anfitrião fechou a mesa.',
    room_full: 'Essa mesa está cheia.',
    room_not_found: 'Não há nenhuma mesa com esse código.',
    room_paused: 'O jogo está em pausa. Espera pelo anfitrião.',
    room_plays_aloud: 'Esta mesa responde em voz alta, sem ecrã para entrar.',
    screen: {
      build: 'versão {build}',
      description:
        'O jogo deparou-se com algo de que não conseguiu recuperar. Recarregar resolve quase sempre — e se o site foi atualizado enquanto este separador estava aberto, resolve sempre.',
      reload: 'Recarregar a página',
      report: 'Se voltar a acontecer, esta linha diz-nos o que falhou:',
      title: 'Algo falhou'
    },
    sheet_not_full:
      'Para dizer stop, cada linha precisa de uma palavra com a letra.',
    spoken_needs_two_teams:
      'Equipa a equipa precisa de duas equipas com alguém em cada uma.',
    stale_round: 'Essa ronda já acabou.',
    teams_locked: 'As equipas já não podem mudar assim.',
    wall_dismissed: 'O anfitrião dispensou este ecrã.',
    wall_not_paired:
      'Este ecrã não está emparelhado. Emparelha-o a partir do ecrã que conduz a mesa.',
    wrong_first_letter:
      'A palavra começa pela letra mostrada. Não conta como tentativa.',
    wrong_length: 'Não é o número certo de letras. Não conta como tentativa.',
    wrong_phase: 'Tarde demais, o jogo já avançou.'
  },
  estimate: {
    answer: {
      label: 'A tua estimativa',
      send: 'Enviar',
      sent: 'Estimativa enviada. À espera dos outros.'
    },
    asks: {
      area: {
        city: 'Qual é a área desta localidade?',
        country: 'Qual é a área deste país?',
        department: 'Qual é a área deste departamento?',
        region: 'Qual é a área desta região?'
      },
      elevation: { mountain: 'Qual é a altitude desta montanha?' },
      height: { building: 'Qual é a altura deste edifício?' },
      length: { river: 'Qual é o comprimento deste rio?' },
      population: {
        city: 'Quantas pessoas vivem nesta cidade?',
        country: 'Quantas pessoas vivem neste país?',
        department: 'Quantas pessoas vivem neste departamento?',
        region: 'Quantas pessoas vivem nesta região?'
      },
      price: { item: 'Quanto custa?' }
    },
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} número da casa',
            other: '{?} números da casa',
            zero: '{?} números da casa'
          }
        }
      }),
      spent: 'Números da casa esgotados'
    },
    home: {
      description:
        'Uma pergunta cuja resposta é um número — quantas pessoas vivem no Japão, qual a altitude do Monte Branco, quanto custava uma PlayStation 5 no lançamento — e toda a gente escreve a sua estimativa. Ninguém precisa de saber: quanto mais perto, mais pontos, e a revelação põe cada palpite lado a lado com o valor real.'
    },
    line: {
      divided: '÷{factor}',
      times: '×{factor}'
    },
    name: 'O número certo',
    /** A number the evening asked in its own unit, which is written as given. */
    ownUnit: '{value} {unit}',
    play: 'Jogar O número certo',
    reveal: {
      over: 'Demasiado alto · ×{factor}',
      spotOn: 'Em cheio',
      under: 'Demasiado baixo · ÷{factor}',
      yours: 'Disseste {guess}'
    },
    roundDuration: 'Tempo para estimar',
    scoring:
      'Uma pergunta cuja resposta é um número, e toda a gente escreve a sua estimativa. Acertar em cheio vale 100 pontos, descendo até zero a três vezes acima ou abaixo do valor — quanto mais perto, mais vale. Sem bónus de rapidez.',
    tagline: 'Ninguém sabe. Quem chega mais perto?',
    /** What the host ticks to choose the questions, each a measure rather than a source. */
    topics: {
      area: 'Áreas',
      height: 'Alturas',
      label: 'Perguntas sobre',
      length: 'Comprimentos',
      population: 'Populações',
      price: 'Preços'
    },
    unitNames: {
      euros: '€',
      kilometres: 'km',
      metres: 'm',
      people: 'habitantes',
      squareKilometres: 'km²'
    },
    units: {
      euros: '{value} €',
      kilometres: '{value} km',
      metres: '{value} m',
      people: '{value} habitantes',
      squareKilometres: '{value} km²'
    }
  },
  /** The page a line-up shared as a link opens on. */
  eveningLink: {
    documentTitle: '{name} — Mêlée',
    open: 'Abrir uma mesa',
    save: 'Guardar',
    saved: 'Guardada',
    /** Under the save press once the line-up is kept. */
    savedWhere: 'Fica à tua espera na página inicial, em «As tuas partidas».',
    unreadable: {
      description:
        'O link ficou provavelmente cortado pelo caminho. Pede-o outra vez, inteiro.',
      documentTitle: 'Link cortado — Mêlée',
      title: 'Esta partida não abre'
    }
  },
  higherlower: {
    answer: {
      counter: 'Par {index:number} de {count:number}',
      sent: 'Escolha enviada. À espera dos outros.'
    },
    asks: {
      area: {
        city: 'Que localidade ocupa mais área?',
        country: 'Que país é maior?',
        department: 'Que departamento é maior?',
        region: 'Que região é maior?'
      },
      elevation: { mountain: 'Que montanha é mais alta?' },
      height: { building: 'Que edifício é mais alto?' },
      length: { river: 'Que rio é mais comprido?' },
      population: {
        city: 'Que cidade tem mais habitantes?',
        country: 'Que país tem mais habitantes?',
        department: 'Que departamento tem mais habitantes?',
        region: 'Que região tem mais habitantes?'
      },
      price: { item: 'Qual custa mais?' }
    },
    dealt: 'Dois nomes. Qual é o maior?',
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} par da casa',
            other: '{?} pares da casa',
            zero: '{?} pares da casa'
          }
        }
      }),
      spent: 'Pares da casa esgotados'
    },
    home: {
      description:
        'Duas cidades, dois rios, duas montanhas: qual tem mais habitantes, qual é mais comprido, qual é mais alta? Um par por ronda, uma escolha, e a revelação mostra os dois números.'
    },
    name: 'Mais ou menos',
    play: 'Jogar Mais ou menos',
    reveal: {
      higher: 'o maior',
      score: '{right:number} de {count:number} certos',
      yourPick: 'a tua escolha'
    },
    roundDuration: 'Tempo para escolher',
    scoring:
      'Duas coisas do mesmo tipo — duas cidades, dois rios, duas montanhas — e escolhes a maior. Uma escolha certa vale 100 pontos.',
    tagline: 'Dois nomes. Qual deles é maior?'
  },
  home: {
    /** Over the games the host judges however they are answered, shelved after the rest. */
    judgedGames: 'Decididos pelo anfitrião',
    opening: 'A abrir a mesa…',
    openWith: defineTranslation('Abrir uma mesa · {count:plural}', {
      plural: {
        count: { one: '{?} jogo', other: '{?} jogos', zero: '{?} jogos' }
      }
    }),
    /** When the last table on a line-up was played, on its ticket. */
    played: {
      days: defineTranslation('Jogada {when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'day' } }
      }),
      months: defineTranslation('Jogada {when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'month' } }
      }),
      weeks: defineTranslation('Jogada {when:relative}', {
        relative: { when: { numeric: 'auto', unit: 'week' } }
      })
    },
    resume: 'Voltar à mesa',
    /** A ticket's star, pressed when the line-up is saved, which leads the row. */
    saveLineUp: 'Guardar «{name}»',
    shelf: 'Ou os teus próprios jogos',
    shelfHint:
      'Marca o que «Abrir uma mesa» abre. As tuas escolhas ficam guardadas para a próxima vez.',
    tickUnjudged: 'Marcar todos menos os que o anfitrião decide',
    title: 'Mêlée',
    untickAll: 'Desmarcar todos',
    /** The row of line-ups the host starred or played on this machine. */
    yourLineUps: {
      /** Folds the row back over the tickets past its first six. */
      fewer: 'Menos',
      hint: 'Primeiro as partidas guardadas, depois as que jogaste, da mais recente para a mais antiga.',
      /** Unfolds the tickets the folded row hides, after its first six. */
      more: defineTranslation('e {count:plural}', {
        plural: { count: { other: 'mais {?}' } }
      }),
      putBack: 'Repor',
      remove: 'Retirar «{name}»',
      removed: '«{name}» retirada',
      starHint:
        'Marca uma partida com uma estrela para a guardar: na próxima visita, fica à cabeça desta fila.',
      title: 'As tuas partidas'
    }
  },
  host: {
    answered: defineTranslation('{count:plural} de {total:number}', {
      plural: {
        count: {
          one: '{?} resposta',
          other: '{?} respostas',
          zero: '{?} respostas'
        }
      }
    }),
    answerMode: {
      buzzer: 'Quem tocar primeiro',
      calculation: 'Acertar na conta',
      choice: 'Quatro opções',
      colour: 'Refazer a cor',
      label: 'Como se responde',
      letters: 'Fazer a palavra mais longa',
      match: 'Pensar como a mesa',
      move: 'Mover o fósforo',
      number: 'Escrever um número',
      order: 'Pôr por ordem',
      pairs: 'Escolher o maior',
      point: 'Marcar no mapa',
      spoken: 'Equipa a equipa',
      typed: 'Escrever',
      vote: 'Votar em alguém',
      word: 'Encontrar a palavra'
    },
    answerWindow: {
      label: 'Tempo para responder depois de tocar'
    },
    /** A seat taken while a game runs, said for a few seconds and gone. */
    arrival: '<name>{nickname}</name> chega à mesa',
    autoAdvance: 'Tempo até à ronda seguinte',
    backToRoom: 'Voltar à mesa',
    closeRoom: {
      confirm: 'Sim, fechar',
      label: 'Fechar a mesa',
      warning: 'Toda a gente sai, e o código deixa de funcionar.'
    },
    countdown: 'Contagem decrescente',
    difficulty: {
      easy: 'Fácil',
      evening: 'Nível de todos os jogos',
      hard: 'Difícil',
      hint: {
        easy: 'Só o muito conhecido: dá para jogar com crianças.',
        hard: 'Menos respostas óbvias, para uma mesa que sabe do assunto.',
        mixed: 'Do mais famoso ao mais obscuro.'
      },
      label: 'Nível',
      mixed: 'Misto'
    },
    endGame: 'Terminar a partida',
    evening: {
      actions: 'Opções de {name}',
      add: 'Adicionar um jogo',
      addHint: 'Outro jogo, ou o mesmo configurado de outra forma',
      challengeLine:
        'O desafio escolhe-se quando chega a sua ronda, entre três: primeiro os teus, depois os do banco.',
      chance: {
        among: 'entre {games}',
        drawn: '{count:number} ao acaso',
        endless: 'Depois ao acaso, até parares',
        over: 'a mais para {total:number} rondas',
        overHint:
          'Cada jogo previsto joga-se uma vez: a partida precisa de mais rondas.',
        race: 'Depois ao acaso, até alguém chegar ao fim',
        raise: 'Passar para {count:number}'
      },
      detail: {
        allSubjects: 'Todos os temas',
        drawnCategories: '{count:number} categorias sorteadas',
        everyDecade: 'Todas as décadas',
        loneFinds: 'Uma resposta única vale o dobro',
        oneGo: 'Uma tentativa cada',
        openField: 'Tentativas ilimitadas',
        playlist: 'Playlist Deezer {id}',
        search: '«{query}»',
        swatch: 'Mostrada {shown:number} s, {rebuild:number} s para a refazer',
        without: 'Sem {letters}'
      },
      drag: 'Mover a ronda {number:number}, {name}',
      draw: {
        add: 'Adicionar um jogo ao sorteio',
        addHint: 'Só por sorteio, sem ronda prevista',
        brought:
          'Um jogo cujo conteúdo trazes tu joga-se uma vez: nunca é sorteado.',
        empty: 'Nenhum jogo no sorteio: pode sair qualquer jogo previsto.',
        heading: 'Ao acaso',
        inDraw: 'No sorteio',
        inDrawNamed: '{name} no sorteio',
        onlyDrawn: 'Só no sorteio',
        said: 'Cada ronda depois das previstas é sorteada entre estes jogos.',
        takeOut: 'Tirar {name} do sorteio'
      },
      duplicate: 'Duplicar',
      earlier: 'Mais cedo',
      fills: 'Preenche o resto',
      fixed: 'Já jogada: já não muda.',
      fold: {
        fewer: 'Mostrar menos',
        more: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: 'Mostrar a seguinte',
              other: 'Mostrar as {?} seguintes',
              zero: 'Mostrar as {?} seguintes'
            }
          }
        })
      },
      later: 'Mais tarde',
      next: 'O que falta',
      once: 'Joga-se uma vez',
      pastThePlan: {
        draw: 'Ao acaso',
        label: 'Depois',
        repeat: 'Do início'
      },
      pick: 'Adicionar um jogo',
      pickHint:
        'Um jogo cujo conteúdo trazes tu joga-se uma vez. Os outros preenchem as rondas que não preparaste.',
      planned: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: 'Previsto',
            other: 'Previsto {?}×',
            zero: 'Previsto {?}×'
          }
        }
      }),
      roundNamed: 'Ronda {number:number}: {name}',
      rounds: 'Jogos previstos',
      settings: 'Configurar',
      slateKeyLater: 'As respostas escrevem-se quando for a próxima.',
      span: {
        all: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: '{?} ronda',
              other: '{?} rondas',
              zero: '{?} rondas'
            }
          }
        }),
        endless: 'até parares',
        from: 'a partir da ronda {from:number}',
        last: 'ronda {number:number}',
        race: 'até alguém chegar ao fim',
        rest: 'rondas {from:number} a {to:number}'
      },
      stamp: {
        beyond: 'Fora do plano',
        count: '{count:number}×',
        first: 'Primeira',
        next: 'A seguir',
        now: 'Agora',
        once: 'Uma vez',
        played: 'Jogada'
      },
      takenOut: 'Retirado da partida: {name}',
      undo: 'Desfazer'
    },
    eveningEnd: {
      finish: 'Chegada',
      finishSummary: 'Ganha quem chegar primeiro',
      hint: {
        countOnTrack:
          'Chegar ao fim não a termina: espera-se lá pela última ronda.',
        finish: 'A partida acaba assim que alguém chega à última casa.'
      },
      label: 'Fim da partida'
    },
    familyFriendly: {
      hint: {
        off: 'O quiz pode calhar em perguntas para adultos.',
        on: 'Nenhuma pergunta para adultos.'
      },
      label: 'Para toda a família',
      summaryOff: 'com perguntas para adultos'
    },
    final: {
      nobody: 'Ninguém pontuou',
      tied: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'partilham o primeiro lugar com {?} ponto',
            other: 'partilham o primeiro lugar com {?} pontos',
            zero: 'partilham o primeiro lugar com {?} pontos'
          }
        }
      }),
      tiedOnCase: 'partilham o primeiro lugar na casa {case:number}',
      wins: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'ganha com {?} ponto',
            other: 'ganha com {?} pontos',
            zero: 'ganha com {?} pontos'
          }
        }
      }),
      winsOnCase: 'ganha na casa {case:number}'
    },
    game: {
      label: 'A que jogamos',
      prompt:
        'Escolhe um jogo para o planear. Podes juntar outros para jogar de seguida.'
    },
    holdReveal: 'Esperar',
    hostDecides: 'Tu decides',
    inPlay: defineTranslation('{count:plural} de {total:number} em jogo', {
      plural: { count: { other: '{?}' } }
    }),
    /** On a judged answer mode and on the box of a game judged however it is answered. */
    judgedMark: {
      host: 'O anfitrião decide',
      you: 'Tu decides, sem jogar'
    },
    lineUp: {
      takeOut: 'Retirar'
    },
    needsGame: 'Escolhe a que joga a mesa',
    needsPlayer: 'É preciso pelo menos uma pessoa à mesa',
    /** Beside *Next round*: opens it as two seats of two teams head to head, the room watching. */
    nextDuel: 'Em duelo',
    nextRound: 'Ronda seguinte',
    /**
     * The console's own panel beside the stage, or its screens behind a tab bar
     * below the split. `stage` is the bar's first tab, the game itself.
     */
    panel: {
      fold: 'Recolher o painel',
      label: 'Conduzir a mesa',
      /** Past the lobby, in place of the teams and the board the server no longer lets change. */
      settled: 'Fixado para esta partida',
      tabs: {
        game: 'Jogos',
        players: 'Jogadores',
        room: 'Sala',
        stage: 'Jogar',
        table: 'Mesa'
      },
      toLeft: 'Mover o painel para a esquerda',
      toRight: 'Mover o painel para a direita',
      unfold: 'Abrir o painel'
    },
    /** The reveal of a turn with another team still to play its round. */
    playAgain: 'Jogar outra vez',
    players: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} jogador',
            other: '{?} jogadores',
            zero: '{?} jogadores'
          }
        }
      }),
      removeNamed: 'Retirar <name>{nickname}</name>'
    },
    /** The console laid out in three zones while a wall shows the game. */
    podium: {
      /** Names the roster's row menu, whose trigger is a bare glyph. */
      actions: 'Opções para {nickname}',
      casesHint:
        '− e +: uma casa por toque, para uma resposta que o jogo não viu.',
      empty:
        'Ainda ninguém. Lê {code} em voz alta, ou mostra o código QR no ecrã da sala.',
      /** The roster's summary on a narrow screen, after its first three seats. */
      more: '+{count:number}',
      pointsHint:
        '− e +: {points:number} pontos por toque, para uma resposta que o jogo não viu.',
      roster: 'Jogadores',
      settings: 'Definições',
      tied: 'empate'
    },
    /**
     * Points by hand, for a bonus nobody planned or a challenge played at the
     * table. `give` and `take` name a row's + and − for whoever cannot see the
     * name they sit beside.
     */
    points: {
      give: 'Mais {points:number} pontos para {name}',
      label: 'Pontos',
      take: 'Menos {points:number} pontos para {name}'
    },
    ready: {
      everyone: 'Toda a gente cá está',
      hostAlone: {
        hint: {
          off: 'Assim que toda a mesa disser «Cá estou», a ronda seguinte arranca sozinha.',
          on: 'Ninguém tem de dizer «Cá estou»: a ronda seguinte arranca quando a lançares.'
        },
        label: 'Tu lanças cada ronda',
        summaryOn: 'tu lanças cada ronda'
      }
    },
    recovery: {
      action: 'Conduzir a mesa daqui',
      description: 'Está no separador Sala do anfitrião, em Este ecrã.',
      field: 'Código de recuperação',
      hint: 'Escreve-o noutro ecrã para conduzir a mesa a partir de lá.',
      invalid: 'Isto não é um código de recuperação.',
      refused: 'Este código não corresponde a esta mesa.',
      retry: 'Tentar outra vez',
      reveal: 'Mostrar o código de recuperação'
    },
    reveal: 'Dar a resposta',
    /** The console's Room tab: the room drawn from above, each shape the button for what it does. */
    roomScene: {
      here: {
        mark: 'Aqui',
        name: 'Este ecrã',
        playsToo: 'E também jogas nele.',
        runs: 'É este ecrã que conduz a mesa.',
        showsGame: 'Mostra o jogo e toca o som.',
        state: 'és tu que conduzes'
      },
      label: 'A sala vista de cima',
      seat: {
        betweenRounds: 'Podes ocupar um lugar entre duas rondas.',
        free: 'livre',
        launchSeats:
          'Ainda ninguém se sentou: começar a partida dá-te um lugar.',
        lines:
          'Conduzes a mesa sem jogar. Ocupa um lugar para responder a partir deste ecrã, como os outros a partir do seu.',
        name: 'O teu lugar',
        title: 'Jogar também',
        titleTaken: 'O teu lugar à mesa'
      },
      sound: {
        here: 'Aqui',
        playsOn: 'Toca em',
        title: 'O som',
        wall: 'O ecrã da sala',
        wallNumbered: 'Ecrã {number:number}'
      },
      table: {
        count: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: '{?} jogador',
              other: '{?} jogadores',
              zero: '{?} jogadores'
            }
          }
        }),
        empty: 'Ainda ninguém à mesa',
        emptyButYou: 'Ainda não há mais ninguém à mesa'
      },
      wall: {
        anotherLines:
          'Também mostra o jogo, sem o som: só um ecrã o toca. Abre o Mêlée nele, escolhe «Tornar-se o ecrã da sala» e escreve aqui o código que ele mostra.',
        anotherTitle: 'Mais um ecrã',
        dismiss: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: 'Libertar o ecrã da sala',
              other: 'Libertar os ecrãs da sala',
              zero: 'Libertar os ecrãs da sala'
            }
          }
        }),
        linesOff:
          'Por agora, este ecrã mostra o jogo e toca o som. Não é preciso mais nada: joga-se muito bem assim.',
        linesOn: defineTranslation('{count:plural}', {
          plural: {
            count: {
              one: 'Mostra o jogo e toca o som, a não ser que mantenhas o som aqui. Este ecrã fica com os comandos.',
              other:
                'Mostram o jogo; o som toca no que escolheres, ou aqui. Este ecrã fica com os comandos.',
              zero: 'Mostram o jogo; o som toca no que escolheres, ou aqui. Este ecrã fica com os comandos.'
            }
          }
        }),
        name: 'O ecrã da sala',
        off: 'nenhum por agora',
        on: defineTranslation('{count:plural}', {
          plural: {
            count: { one: 'ligado', other: '{?} ligados', zero: '{?} ligados' }
          }
        }),
        pairLines:
          'Abre o Mêlée nele e escolhe «Tornar-se o ecrã da sala», depois escreve aqui o código que ele mostra.',
        pairTitle: 'Um ecrã ao lado',
        tabTitle: 'Ou um separador deste',
        titleOff: 'Pôr o jogo noutro ecrã',
        titleOn: 'O ecrã da sala'
      }
    },
    roundCount: {
      open: 'Sem fim',
      openSummary: 'Até parares',
      summary: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} ronda', other: '{?} rondas', zero: '{?} rondas' }
        }
      })
    },
    rounds: 'Rondas',
    saved: {
      door: 'Partidas guardadas',
      doorCount: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} guardada',
            other: '{?} guardadas',
            zero: '{?} guardadas'
          }
        }
      }),
      doorEmpty: 'Guarda esta para a repetir noutro dia',
      empty:
        'Ainda não há partidas guardadas. Dá um nome a esta para a repetir noutro dia.',
      endless: 'Sem fim',
      export: 'Exportar',
      exportFileName: 'melee-partidas.json',
      forget: 'Esquecer {name}',
      heading: 'Partidas guardadas',
      import: 'Importar',
      imported: defineTranslation('{evenings:plural} e {lines:plural}.', {
        plural: {
          evenings: {
            one: '{?} partida importada',
            other: '{?} partidas importadas',
            zero: 'Nenhuma partida importada'
          },
          lines: {
            one: '{?} frase nova adicionada',
            other: '{?} frases novas adicionadas',
            zero: 'nenhuma frase nova'
          }
        }
      }),
      importRefused: 'Este ficheiro não é uma exportação do Mêlée.',
      inLobby: 'Uma partida guardada lança-se antes da primeira ronda.',
      loaded: 'A jogar «{name}»',
      name: 'Nome da partida',
      replace: 'Substituir',
      replaces:
        'Já há uma partida guardada com este nome: esta fica no lugar dela.',
      rounds: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} ronda', other: '{?} rondas', zero: '{?} rondas' }
        }
      }),
      run: 'Lançar {name}',
      save: 'Guardar',
      savedOver: '«{name}» está atualizada',
      saveOver: 'Guardar por cima',
      saveOverNamed: 'Guardar por cima de «{name}»',
      transferHint:
        'As tuas partidas e as tuas frases cabem num ficheiro, para as recuperares noutro ecrã.'
    },
    seat: {
      action: 'Ocupar um lugar',
      /**
       * What the seat costs, which is not the same thing in a game with no
       * answer to hold back: there the screen is the whole of it, and promising
       * a hidden answer would name something the round does not have.
       */
      cost: {
        hiddenAnswer: 'Deixas de ver a resposta antes dos outros.',
        sharedScreen: 'Corres no ecrã que a mesa inteira está a ver.'
      },
      label: 'Jogar a partir deste ecrã, como',
      leave: 'Deixar o lugar',
      offer: 'Jogar a partir deste ecrã',
      sittingOut: 'Decides esta ronda e voltas a jogar na seguinte.',
      taken: 'Estás a jogar como <name>{nickname}</name>.',
      /**
       * Why there is no seat here, one line per `SeatWithheldReason`. `mode`
       * names the way out rather than the rule, because the strip that undoes
       * it is on the same screen a few lines up.
       */
      withheld: {
        aloud:
          'As equipas respondem em voz alta e tu decides, por isso não há lugar aqui.'
      }
    },
    seconds: '{seconds:number} s',
    seeResults: 'Ver os resultados',
    setup: {
      group: {
        room: 'A sala',
        table: 'A mesa'
      },
      roundInPlay: 'As alterações valem a partir da ronda seguinte',
      summary: {
        countdown: 'Contagem de {duration}',
        hold: 'Resposta à vista durante {duration}',
        holdOpen: 'Próxima ronda quando quiseres'
      }
    },
    skipRound: 'Saltar esta ronda',
    speedBonus: {
      hint: {
        off: 'Só conta a resposta certa: vale os 100 pontos.',
        on: 'Uma resposta perfeita vale 90, e dá-la cedo acrescenta até 10.'
      },
      label: 'Bónus de rapidez',
      summaryOff: 'sem bónus de rapidez'
    },
    standings: 'Classificação',
    startGame: 'Para a mesa!',
    /** The room's own screen while the teams sit down: the evening's card and the trays under it. */
    table: {
      arrivals: {
        chosen: '{count:number} à mesa, a escolher as equipas',
        drawn: '{count:number} à mesa, à espera do sorteio',
        seats: '{count:number} à mesa, cada um com um peão na Partida'
      },
      evening: 'Partida em equipas',
      eveningSeats: 'Cada um por si',
      /** The seats a list on the wall has no room left to name. */
      more: '+{count:number}',
      rules: {
        points: defineTranslation(
          '{rounds:plural}: ganha a equipa que marcar mais.',
          {
            plural: {
              rounds: {
                one: '{?} ronda',
                other: '{?} rondas',
                zero: '{?} rondas'
              }
            }
          }
        ),
        pointsOpen: 'Ganha a equipa que marcar mais.',
        seatTrack: defineTranslation(
          '{rounds:plural}, {length:number} casas: ganha quem for mais longe.',
          {
            plural: {
              rounds: {
                one: '{?} ronda',
                other: '{?} rondas',
                zero: '{?} rondas'
              }
            }
          }
        ),
        seatTrackOpen:
          '{length:number} casas, sem fim: ganha quem estiver mais longe no fim.',
        seatTrackRace: '{length:number} casas: ganha quem chegar primeiro.',
        track: defineTranslation(
          '{rounds:plural}, {length:number} casas: ganha a equipa que for mais longe.',
          {
            plural: {
              rounds: {
                one: '{?} ronda',
                other: '{?} rondas',
                zero: '{?} rondas'
              }
            }
          }
        ),
        trackOpen:
          '{length:number} casas, sem fim: ganha a equipa mais avançada no fim.',
        trackRace: '{length:number} casas: ganha a primeira equipa a chegar.'
      }
    },
    /** How the rounds from here are played, offered where a round can be one team's. */
    verdict: {
      right: 'Certo',
      showAnswer: 'Mostrar a resposta',
      wrong: 'Errado'
    }
  },
  innerclock: {
    counted: defineTranslation('{seconds:number} s', {
      number: {
        seconds: { maximumFractionDigits: 1, minimumFractionDigits: 1 }
      }
    }),
    endCount: 'Parar a contagem',
    gap: defineTranslation('{seconds:number} s', {
      number: {
        seconds: {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
          signDisplay: 'exceptZero'
        }
      }
    }),
    go: 'Conta.',
    hint: 'Carrega uma só vez, quando achares que lá estás. Nada se mexe até ao fim.',
    home: {
      description:
        'O ecrã da sala dá um número de segundos e depois todos os ecrãs ficam parados: sem relógio, nada que se mexa. Conta de cabeça e carrega uma só vez quando achares que lá estás — quanto mais perto parares, mais pontos fazes. A mesa pode à vontade distrair-te em voz alta.'
    },
    name: 'Relógio interno',
    nobody: 'Ninguém carregou',
    play: 'Jogar Relógio interno',
    press: 'Parar',
    pressed: 'Registado. Ainda há quem esteja a contar.',
    prompt: {
      after: 'segundos de cabeça',
      before: 'Conta até'
    },
    scoring:
      'Conta de cabeça e carrega uma vez. 100 pontos em cheio, nada a um quarto da contagem de distância — quanto mais perto, mais pontos.',
    silent: 'não carregou',
    tagline: 'Conta de cabeça. Para no segundo exato.',
    target: {
      description: 'Em segundos, de 10 a 180.',
      draw: 'Sortear outro',
      label: 'Contar até'
    }
  },
  invite: {
    action: 'Convidar',
    copied: 'Copiado',
    copyCode: 'Copiar o código',
    copyFailed: 'Não foi possível copiar',
    copyLink: 'Copiar a ligação',
    documentTitle: 'Convite — Mêlée',
    joinLate: 'Entra quando quiseres',
    nextRound: 'Quem chegar durante uma ronda joga a partir da seguinte.',
    project: 'Mostrar o código QR em grande',
    share: 'Partilhar',
    shareTitle: 'Entra na mesa {code} no Mêlée',
    title: 'Lê o código para jogar',
    typeIt: 'Escreve-o para entrar',
    unknown: {
      description:
        'Este código não abre nenhuma mesa. Pode ter sido fechada, ou o código mal lido.',
      title: 'Nenhuma mesa aqui'
    }
  },
  join: {
    host: {
      action: 'Abrir uma mesa'
    },
    player: {
      action: 'Entrar',
      title: 'Entrar numa mesa'
    },
    /**
     * The door beside *open a table*: the table opens with whoever pressed it
     * already seated and the first round under way, and stays open to anyone
     * arriving after. Never *solo*, because the others can still come.
     */
    rightAway: {
      action: 'Jogar já',
      as: 'Como <name>{nickname}</name>',
      change: 'Mudar',
      name: 'Como te chamamos?',
      starting: 'A pôr a mesa…'
    },
    roomCode: {
      label: 'Código da mesa',
      unknown: 'Nenhuma mesa com este código.',
      unsupportedCharacters: 'Um código de mesa nunca tem {characters}.',
      wrongLength: defineTranslation('{length:plural}', {
        plural: {
          length: {
            one: 'Um código de mesa tem {?} carácter.',
            other: 'Um código de mesa tem {?} caracteres.',
            zero: 'Um código de mesa tem {?} caracteres.'
          }
        }
      })
    }
  },
  legal: {
    host: {
      body: 'O Mêlée é alojado, e as suas mesas conduzidas, por:',
      heading: 'Alojamento'
    },
    intro:
      'Quem publica o Mêlée, o que guarda sobre quem joga e durante quanto tempo, e como mudar isso.',
    measurement: {
      body: 'As visitas são contadas por uma ferramenta que eu próprio construí e mantenho a funcionar, em analytics.adrienlcp.com, sem cookies. Uma visualização de página regista o endereço da página, o site de onde vens, o idioma e o tema do teu navegador, a largura da sua janela e a rapidez com que a página carregou. Não regista nenhum endereço IP, nem nada que distinga um visitante de outro.',
      counted: 'As tuas visitas são contadas, de forma anónima.',
      exemption:
        'Segundo as orientações da CNIL, esta medição não exige consentimento, e podes mesmo assim recusá-la neste navegador.',
      heading: 'Medição de audiência',
      refused: 'As tuas visitas não são contadas neste navegador.',
      refusedByBrowser:
        'O teu navegador envia Global Privacy Control, por isso as tuas visitas nunca são contadas.',
      retention: defineTranslation(
        'Cada registo é guardado {months:plural}, no máximo.',
        {
          plural: {
            months: { one: '{?} mês', other: '{?} meses', zero: '{?} meses' }
          }
        }
      ),
      saveFailed:
        'O teu navegador não guardou esta escolha. Tenta outra vez, ou ativa o Global Privacy Control.',
      storageBlocked:
        'Este navegador bloqueia o armazenamento dos sites, por isso não é possível guardar aqui uma recusa. Ativar o Global Privacy Control no teu navegador recusa a medição em todos os sites.',
      switch: 'Contar as minhas visitas'
    },
    publisher: {
      address:
        'Enquanto editor não profissional, indico a identidade do fornecedor de alojamento em vez de um endereço postal (LCEN, artigo 6-III-2).',
      body: 'O Mêlée é publicado por {name}, um particular, não uma empresa. Podes escrever-me nesta <contact>página de contacto</contact>.',
      heading: 'Editor'
    },
    rights: {
      body: 'Ao abrigo do RGPD, podes aceder ao que te diz respeito, corrigi-lo ou apagá-lo, ou opor-te ao seu uso. Quase tudo vive no teu navegador, e apagar os dados deste site apaga-o. Para o resto, pede através da <contact>página de contacto</contact>; respondo no prazo de um mês.',
      complaint:
        'Se consideras que os teus direitos não são respeitados, podes apresentar uma reclamação à <authority>CNIL</authority>.',
      heading: 'Os teus direitos'
    },
    storage: {
      analyticsOptOut:
        'A tua recusa da medição de audiência, se a desligares mais abaixo.',
      bugReports:
        'Se carregares em «Comunicar um problema» no menu, esse ecrã envia ao Mêlée o que lá escreveste, se escreveste alguma coisa, com o que sabe nesse momento: a cadeia de identificação completa do navegador, a aplicação em que foi aberto, o tamanho do ecrã, o seu zoom e as suas margens de segurança, o teu tema e o teu idioma, o endereço da página, o código da mesa, o seu jogo, a sua fase e a sua ronda, a mesa tal como esse ecrã a mostra — incluindo os nomes de quem lá está —, o estado da sua ligação e o que o ecrã passou nos últimos dois minutos: redimensionamentos, rotações, a abertura do teclado, que tipo de campo tinha o foco — nunca o que lá foi escrito — e os seus erros. Nada sai antes de carregares em Enviar, nenhum endereço IP é guardado com ele, e é apagado ao fim de 30 dias.',
      challengeLines:
        'As frases de desafio que o anfitrião escreveu antecipadamente, e quais delas já foram jogadas.',
      device:
        'O Mêlée não usa cookies. O que memoriza fica no teu navegador, só para este site, até o apagares:',
      errorReports:
        'Quando algo avaria num ecrã — uma página que não se desenha, um excerto que fica em silêncio —, esse ecrã envia um relatório ao Mêlée: o erro e o sítio do código onde aconteceu, o endereço da página, o nome e a versão do navegador, o tamanho do ecrã, o código da mesa, o seu jogo, a sua fase e a sua ronda, se o ecrã toca o som e a que volume, e os tipos das últimas mensagens que trocou, nunca o que diziam. Não contém nenhum nome, nenhuma resposta, nada do que escreveste nem nenhum endereço IP, e é apagado ao fim de 30 dias. Serve para corrigir uma falha vista uma única vez numa televisão, não para medir a audiência, por isso o interruptor de audiência mais abaixo não o desliga.',
      heading: 'O que o Mêlée guarda',
      hostSetup:
        'Como configuraste a última mesa que conduziste, jogo a jogo, para que a próxima abra da mesma maneira.',
      hostTokens:
        'A chave de cada mesa que abriste, que te deixa retomá-la a partir de outro ecrã. Esquecida ao fim de um dia.',
      lineUpGames:
        'Os jogos da última mesa que conduziste, novamente assinalados na próxima mesa que abrires.',
      locale: 'O idioma que escolheste.',
      logs: 'A Cloudflare guarda um registo de cada pedido durante três dias, para descobrir o que avariou: contém o teu endereço IP e o nome do teu navegador ao lado do código da mesa, e nunca um nome nem uma resposta.',
      mostlikelyLines:
        'As frases de «Quem de nós?» que o anfitrião escreveu antecipadamente, e quais delas já foram jogadas.',
      nickname:
        'O nome com que jogaste da última vez, para que a próxima mesa o preencha por ti.',
      ownLineUpsHeight:
        'A altura com que as tuas partidas foram desenhadas na página inicial, e a que largura de janela, para que a próxima visita lhes guarde o espaço antes de carregarem.',
      panelFolded:
        'Se recolheste, da última vez, o painel ao lado da mesa que conduzes.',
      panelSide: 'Em que lado do ecrã puseste esse painel.',
      pawn: 'O peão que escolheste da última vez — a sua cor e a sua cabeça —, que a próxima mesa te dá se ainda ninguém lá o tiver.',
      recentTables:
        'As partidas das últimas mesas que conduziste, cada uma com o seu código, quando foi jogada e quantas rondas durou, para voltares a conduzir uma.',
      savedEvenings:
        'As partidas que guardaste com um nome, cada jogo com as suas definições, para as voltares a conduzir.',
      seats:
        'O lugar que ocupas em cada mesa onde entraste, para que um recarregamento ou um ecrã bloqueado te traga de volta a ele com a tua pontuação. Esquecido ao fim de um dia.',
      server:
        'Enquanto uma mesa está a ser jogada, os servidores da Cloudflare guardam-na: os nomes de quem lá está, as respostas dadas, as pontuações, as definições e as perguntas ou frases que a partida e o anfitrião trouxeram. Tudo é apagado quando o anfitrião fecha a mesa, ou uma hora depois de o último ecrã a deixar. Não há contas, e nada sobre ti sobrevive à mesa.',
      session:
        'Mais dois são guardados apenas para o separador aberto, e desaparecem quando ele fecha:',
      slateKeys:
        'As respostas de uma ardósia que o anfitrião escreveu antecipadamente, antes de a mesa abrir.',
      theme: 'O tema que escolheste: claro, escuro ou o do teu sistema.',
      thinkalikeLines:
        'As propostas de «Pensa como a mesa» que o anfitrião escreveu antecipadamente, e quais delas já foram jogadas.',
      volume:
        'O último volume da sala definido a partir deste ecrã, com o qual começa a próxima mesa que ele abrir.',
      wallSessions:
        'Que ecrã da sala é este separador, para que um recarregamento o mantenha e um segundo separador seja outro ecrã.'
    },
    thirdParties: {
      assistant:
        'Se preparares a partida com um assistente, o seu fornecedor envia ao Mêlée o que ele compôs — a partida e as perguntas que tenha escrito para ti, como um quiz sobre a tua família — e recebe uma ligação de volta. O Mêlée não guarda nada disso pelo caminho: as perguntas viajam apenas na ligação e, numa mesa aberta a partir dela, duram tanto como essa mesa. O que dizes ao assistente rege-se pelos termos do próprio fornecedor.',
      cloudflare:
        'A Cloudflare, o fornecedor de alojamento, recebe o teu endereço IP em cada pedido, para entregar a página e proteger o site de abusos. Abrir uma mesa, ou enviar um relatório de erro fora de uma mesa, fica contado no teu endereço IP durante um minuto, para que ninguém possa inundar o site; o endereço em si nunca é guardado.',
      deezer:
        'O jogo Adivinha a música vai buscar as músicas ao Deezer. O que o anfitrião procura, ou a playlist que indica, é enviado ao Deezer pelo servidor do Mêlée, sem nada sobre ti. Já os excertos de 30 segundos e as capas dos álbuns são carregados pelo teu navegador diretamente dos servidores do Deezer, que recebem por isso o teu endereço IP e o nome do teu navegador. A <policy>política de privacidade do Deezer</policy> aplica-se a eles.',
      heading: 'Quem mais recebe os teus dados',
      nobodyElse:
        'Nenhum outro serviço é chamado. Os tipos de letra são servidos pelo próprio Mêlée, e o código QR é desenhado no teu navegador.'
    },
    title: 'Aviso legal e privacidade'
  },
  loading: 'A carregar…',
  longestword: {
    bestSaid: defineTranslation('O sorteio tinha {word}, {count:plural}', {
      plural: {
        count: { one: '{?} letra', other: '{?} letras', zero: '{?} letras' }
      }
    }),
    draw: 'O sorteio',
    drawSaid: 'O sorteio: {letters}',
    emptyWord: 'A tua palavra, vazia',
    erase: 'Apagar',
    home: {
      description:
        'Nove letras aparecem em todos os ecrãs. Cada um escreve a palavra mais longa que consegue formar com elas, cada letra usada uma vez, quantas palavras quiser: só vale a mais longa. A sala vê o comprimento da palavra de cada um, nunca a palavra, até a revelação mostrar a mais longa que o sorteio escondia.'
    },
    kept: ', a palavra guardada',
    language: 'Palavras em',
    name: 'Palavra mais longa',
    noWord: 'Nenhuma palavra',
    play: 'Jogar Palavra mais longa',
    ranking: 'A palavra mais longa de cada um',
    refusal: {
      already_buzzed:
        'A tua palavra já é tão longa como a mais longa do sorteio.',
      letter_not_in_draw:
        'Uma letra não está no sorteio, ou foi usada duas vezes. Não conta.',
      not_in_dictionary: '«{word}» não está no dicionário. Não conta.',
      not_one_word: 'Uma só palavra, só letras. Não conta.'
    },
    reveal: {
      alsoLong: defineTranslation('{length:plural}: {words}', {
        plural: {
          length: {
            one: 'Também com {?} letra',
            other: 'Também com {?} letras',
            zero: 'Também com {?} letras'
          }
        }
      }),
      title: 'O sorteio tinha'
    },
    roundDuration: 'Tempo para procurar',
    scoring:
      'A tua palavra mais longa vale pelo comprimento face à mais longa do sorteio: do mesmo tamanho vale 100 pontos, mais curta vale menos, e com três letras ou menos não vale nada.',
    seat: 'A tua palavra mais longa',
    send: 'Enviar',
    shuffle: 'Baralhar',
    tagline: 'Nove letras, uma palavra, o mais longa possível.',
    tower: {
      best: defineTranslation('{name}: uma palavra de {count:plural}', {
        plural: {
          count: { one: '{?} letra', other: '{?} letras', zero: '{?} letras' }
        }
      }),
      none: '{name}: ainda sem palavra'
    },
    typing: 'A tua palavra: {word}',
    words: 'As tuas palavras aceites'
  },
  makenumber: {
    distance: 'a {distance:number}',
    exact: 'Conta certa!',
    hint: 'Toca numa peça, num sinal, depois noutra peça.',
    home: {
      description:
        'Seis peças com números e um alvo aparecem em todos os ecrãs. Cada um junta as peças duas a duas — somar, subtrair, multiplicar, dividir — rumo ao alvo, quantas contas quiser: só vale a mais próxima. A sala vê o número de cada um, nunca como lá chegou, até a revelação mostrar o caminho mais curto que as peças permitiam.'
    },
    kept: ', a conta guardada',
    ladder: {
      above: 'Acima',
      below: 'Abaixo',
      empty:
        'Cada um aparece na régua assim que tiver um número — quanto mais perto de {target:number}, mais acima',
      exact: '{name}: conta certa',
      far: 'Mais longe',
      label: 'O número de cada um à volta do alvo',
      seat: '{name}: {value:number}, a {distance:number}',
      waiting: 'Ainda sem número',
      waitingSeat: '{name}: ainda sem número'
    },
    made: ', uma peça calculada',
    name: 'Conta certa',
    operator: {
      add: 'Mais',
      divide: 'Dividido por',
      multiply: 'Vezes',
      subtract: 'Menos'
    },
    operators: 'As operações',
    play: 'Jogar Conta certa',
    rack: 'As tuas peças',
    refusal: {
      already_buzzed: 'Já acertaste na conta: nada mais a enviar.',
      invalid_calculation: 'Essa conta não bate certo com estas peças.'
    },
    reveal: {
      none: 'Nenhuma conta',
      ranking: 'A conta de cada um, a mais próxima primeiro',
      shortest: 'A mais curta, para {target:number}',
      unsent: 'não enviada',
      yours: 'A tua conta'
    },
    roundDuration: 'Tempo para contar',
    scoring:
      'A tua conta mais próxima vale conforme a distância: o alvo exato vale 100 pontos, cada unidade de diferença tira dez, e a dez ou mais não vale nada.',
    seat: 'A tua conta',
    send: 'Enviar',
    sends: 'As tuas contas enviadas',
    startOver: 'Recomeçar',
    tagline: 'Seis peças, um alvo, todas as operações.',
    target: 'O número a atingir: ',
    tilesSaid: 'As peças: {tiles}. O número a atingir: {target:number}.',
    undo: 'Desfazer',
    work: 'A tua conta até agora'
  },
  matchsticks: {
    duration: 'Tempo por enigma',
    goal: {
      biggest: 'Move um fósforo para fazer o maior número',
      equation: 'Move um fósforo para a igualdade ficar certa',
      smallest: 'Move um fósforo para fazer o menor número'
    },
    goals: {
      biggest: 'Maior número',
      equation: 'Igualdades',
      label: 'Enigmas',
      smallest: 'Menor número'
    },
    home: {
      description:
        'Uma igualdade falsa desenhada com fósforos — ou um número a tornar o maior, ou o menor, possível. Cada um pega num fósforo no seu ecrã e pousa-o noutro sítio: a resposta certa vale mais, os números logo a seguir um pouco menos. Ou joga-se em voz alta: o primeiro a tocar a campainha diz que fósforo se move e para onde, e o anfitrião decide. Cada enigma é gerado na hora, por isso o jogo nunca se esgota, e todos têm resposta.'
    },
    move: {
      groove: 'Espaço vazio {slot}, no {glyph} na posição {position:number}',
      label: 'Os fósforos',
      layDown: 'Agora pousa-o num espaço vazio.',
      pickUp: 'Pega num fósforo e pousa-o noutro sítio.',
      placed: 'Envia esta jogada, ou volta a mover um fósforo.',
      send: 'Enviar',
      sent: 'A tua jogada foi enviada. À espera dos outros.',
      slot: {
        a: 'em cima',
        b: 'em cima à direita',
        c: 'em baixo à direita',
        d: 'em baixo',
        e: 'em baixo à esquerda',
        f: 'em cima à esquerda',
        g: 'ao meio',
        h: 'deitado',
        v: 'de pé'
      },
      stick: 'Fósforo {slot}, no {glyph} na posição {position:number}',
      undo: 'Repor',
      unreadable: 'Fósforos que não formam algarismos nem sinais'
    },
    name: 'Fósforos',
    numberRule: {
      buzzer: 'Só conta o melhor número. Um número nunca começa por 0.',
      move: 'Um número nunca começa por 0.'
    },
    play: 'Jogar Fósforos',
    reveal: {
      right: 'certo',
      second: 'segundo melhor',
      short: 'melhor, mas não o suficiente',
      third: 'terceiro melhor',
      title: 'A jogada:',
      wrong: 'falhou',
      yours: 'A tua jogada:'
    },
    scoring:
      'Um fósforo a mover. O primeiro a tocar diz a jogada em voz alta, e o anfitrião decide — 100 pontos se acertar.',
    scoringMove:
      'Um fósforo a mover, toda a gente ao mesmo tempo. A resposta certa vale 100 pontos — num número, o segundo melhor 67 e o terceiro 33.',
    tagline: 'Um fósforo move-se. Descobre qual.'
  },
  menu: {
    build: 'Versão {build}',
    buildDated: 'Versão de {date} · {build}',
    credit: 'Feito por <author>{name}</author>',
    fullscreen: {
      enter: 'Ecrã inteiro',
      exit: 'Sair do ecrã inteiro'
    },
    home: 'Início',
    install: {
      action: 'Instalar Mêlée',
      /** Safari's own words for the two steps, which is what the visitor will look for. */
      apple: 'Para instalar: Partilhar, depois «Adicionar ao ecrã principal».'
    },
    label: 'Menu',
    leaveRoom: 'Sair da mesa',
    /**
     * `label` names the row and its summary is the name itself, which is the
     * only place a screen that skipped the join form ever shows it. `field` is
     * what the empty box below asks for, and it says *new* because the row
     * above is already carrying the old one.
     */
    nickname: {
      action: 'Mudar',
      field: 'Novo nome',
      label: 'Nome'
    },
    reload: 'Recarregar',
    /**
     * `attached` sits under the field because what it lists leaves the device
     * whether or not anything is typed.
     */
    report: {
      attached:
        'Vai com o que este ecrã sabe: o navegador, o tamanho, a mesa e os últimos dois minutos.',
      failed: 'Não foi enviado. Tenta outra vez.',
      field: 'O que aconteceu (opcional)',
      label: 'Comunicar um problema',
      retry: 'Tentar outra vez',
      send: 'Enviar',
      sent: 'Obrigado, já vai a caminho.',
      tooSoon: 'Já foi um há instantes. Tenta outra vez daqui a um minuto.'
    },
    source: 'Código-fonte',
    /** Said by the host, about the machine rather than the table: it outlives the room. */
    thisDevice: {
      qrCode: {
        action: 'Mostrar',
        description: 'Para um ecrã à entrada, sem entrar no jogo.',
        label: 'Mostrar o código QR de uma mesa'
      },
      wall: {
        label: 'Tornar-se o ecrã da sala'
      }
    }
  },
  mostlikely: {
    ballot: {
      label: 'Quem é?',
      sent: 'O teu voto foi enviado. À espera dos outros.',
      you: 'Tu'
    },
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} frase da casa',
            other: '{?} frases da casa',
            zero: '{?} frases da casa'
          }
        }
      }),
      spent: 'Frases da casa esgotadas'
    },
    home: {
      description:
        'Aparece uma frase — quem de nós seria capaz de falar com as plantas? — e cada um vota numa das pessoas da mesa, incluindo em si. Ninguém vê quem votou em quem: a revelação conta os votos, e quem votou com a mesa ganha pontos.'
    },
    name: 'Quem de nós?',
    own: {
      add: 'Adicionar',
      description:
        'Tiradas antes do banco, por esta ordem, mesmo numa ronda que arranca sozinha. Guardadas neste ecrã.',
      field: 'Frase {index:number}',
      new: 'Uma nova frase',
      newPlaceholder: 'Quem de nós seria capaz de…',
      played: 'Jogada',
      remove: 'Remover a frase {index:number}',
      summary: '{count:number} por vir',
      title: 'As tuas frases'
    },
    play: 'Jogar Quem de nós?',
    reveal: {
      chose: 'A mesa escolheu',
      nobody: 'Ninguém: os votos foram para todo o lado.',
      votes: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} voto', other: '{?} votos', zero: '{?} votos' }
        }
      }),
      yourVote: 'O teu voto'
    },
    roundDuration: 'Tempo para votar',
    scoring:
      'Aparece uma frase sobre um de vocês e cada um vota num lugar, incluindo o seu. Vota com a mesa e ganhas 100 pontos. Sem bónus de rapidez.',
    tagline: 'Uma frase, um de vocês. Quem é?'
  },
  /**
   * The way back to the front door, from any page that is a dead end without
   * one. Three screens show it — nothing here, a refused socket, the credits —
   * and one destination is named one way or the product has three fronts.
   */
  mysteryword: {
    found: {
      stillLooking: 'Ainda à procura',
      title: defineTranslation('Encontrada em {count:plural}', {
        plural: {
          count: {
            one: '{?} tentativa',
            other: '{?} tentativas',
            zero: '{?} tentativas'
          }
        }
      })
    },
    grid: 'As tuas tentativas',
    home: {
      description:
        'Uma palavra está escondida, com a primeira letra e o comprimento em todos os ecrãs. Seis tentativas cada um para a encontrar, cada letra colorida: no sítio, noutro sítio da palavra, ou ausente. A mesa vê todas as grelhas a cores, nunca as letras.'
    },
    keyboard: {
      erase: 'Apagar',
      label: 'Letras',
      send: 'Tentar'
    },
    language: 'Palavras em',
    legend: {
      absent: 'não está',
      placed: 'no sítio',
      present: 'noutro sítio'
    },
    length: '{count:number} letras',
    mark: {
      absent: 'não está na palavra',
      placed: 'no sítio',
      present: 'noutro sítio da palavra'
    },
    name: 'Palavra mistério',
    notFound: 'Não encontrada',
    play: 'Jogar Palavra mistério',
    refusal: {
      not_in_dictionary:
        '«{word}» não está no dicionário. Tentativa não gasta.',
      not_one_word: 'Uma só palavra, só letras. Tentativa não gasta.',
      wrong_first_letter:
        'A palavra começa pela letra dada. Tentativa não gasta.',
      wrong_length: 'Preenche todas as letras primeiro. Tentativa não gasta.'
    },
    reveal: {
      title: 'A palavra era'
    },
    roundDuration: 'Tempo para a encontrar',
    scoring:
      'Uma palavra encontrada à primeira ou à segunda tentativa vale 100 pontos, depois 85, 70, 55 e 40 nas seguintes; uma palavra não encontrada não vale nada.',
    skeleton: '{length:number} letras, começa por {letter}',
    spent: {
      detail: 'A palavra fica escondida até ao fim da ronda.',
      title: 'Sem tentativas'
    },
    tagline: 'Seis tentativas para encontrar a palavra escondida.',
    tower: {
      found: defineTranslation('{name}: encontrada em {count:plural}', {
        plural: {
          count: {
            one: '{?} tentativa',
            other: '{?} tentativas',
            zero: '{?} tentativas'
          }
        }
      }),
      searching: defineTranslation(
        '{name}: {placed:number} no sítio, {count:plural}',
        {
          plural: {
            count: {
              one: '{?} tentativa',
              other: '{?} tentativas',
              zero: '{?} tentativas'
            }
          }
        }
      ),
      tries: '{used:number}/{count:number}'
    },
    typing: 'A tua tentativa: {word}',
    wallLegend: 'Um degrau por letra no sítio, na melhor tentativa de cada um',
    wordLength: 'Letras'
  },
  navigation: {
    back: 'Voltar aos jogos',
    skipToContent: 'Saltar para o conteúdo'
  },
  notFound: {
    description: 'Esse jogo acabou, ou o código foi mal escrito.',
    documentTitle: 'Ninguém aqui — Mêlée',
    title: 'Ninguém aqui'
  },
  notice: {
    dismiss: 'Fechar',
    /** What a sound check found, on the screen that played it or, `onWall`, on the console. */
    soundCheck: {
      blocked: 'O navegador recusou o som aqui.',
      catalogue:
        'O catálogo de música não responde. Tenta outra vez daqui a pouco.',
      heard: 'Aqui ouve-se o som.',
      onWall: {
        blocked:
          'O ecrã da sala fica em silêncio até alguém lá carregar em Ligar o som.',
        heard: 'Ouve-se o som no ecrã da sala.',
        stalled:
          'A música fica presa a carregar no ecrã da sala. Verifica a ligação desse ecrã.',
        unreachable:
          'O ecrã da sala não consegue carregar a música. Um bloqueador de anúncios, a proteção contra rastreio do navegador ou um filtro de rede costuma bloqueá-la: autoriza este site nesse ecrã.'
      },
      stalled:
        'A música fica presa a carregar aqui. Verifica a ligação deste ecrã.',
      start: 'Ligar o som',
      tooMany: 'São muitos testes. Espera um minuto e tenta outra vez.',
      unreachable:
        'A música não carrega aqui. Um bloqueador de anúncios, a proteção contra rastreio do navegador ou um filtro de rede costuma bloqueá-la: autoriza este site.'
    }
  },
  pawn: {
    /** Under the pieces while a round plays, which is when the server refuses a change. */
    betweenRounds: 'Muda-se entre duas rondas, não durante uma.',
    /** One pawn's colour, where `team.colour` is what a team of them is called. */
    colour: {
      pawn1: 'Vermelho',
      pawn2: 'Azul',
      pawn3: 'Amarelo',
      pawn4: 'Verde',
      pawn5: 'Roxo',
      pawn6: 'Laranja',
      pawn7: 'Rosa',
      pawn8: 'Turquesa',
      pawn9: 'Verde-lima',
      pawn10: 'Castanho',
      pawn11: 'Magenta',
      pawn12: 'Celeste'
    },
    /** The head a seat's piece wears beside its colour, as `piece` names it. */
    head: {
      point: 'cabeça pontiaguda',
      round: 'cabeça redonda',
      square: 'cabeça quadrada'
    },
    /** Names the pieces: a seat's own pawn, or its team's when it sits in one. */
    label: {
      seat: 'O meu peão',
      team: 'O peão da minha equipa'
    },
    /** A seat's piece, named whole: its colour's word, then its head. */
    piece: '{colour}, {head}',
    /**
     * The press that opens the pieces. `label` is all it prints; `seat` is its
     * whole name for a screen reader, starts with the printed word and ends on
     * the piece the seat stands as.
     */
    press: {
      label: 'Cor',
      seat: 'Cor do meu peão, {piece}'
    },
    taken: '{pawn}, já escolhido',
    takenBy: '{pawn}, escolhido por {holder}',
    /** Under a team's twelve: the seat is not the only one it repaints. */
    teamHint: 'Toda a tua equipa muda de cor com ele.'
  },
  petitbac: {
    category: {
      animal: 'Animal',
      bodyPart: 'Parte do corpo',
      brand: 'Marca',
      cartoonCharacter: 'Personagem de desenhos animados',
      cheese: 'Queijo',
      city: 'Cidade',
      clothing: 'Roupa',
      colour: 'Cor',
      country: 'País',
      dish: 'Prato',
      drink: 'Bebida',
      famousPerson: 'Pessoa famosa',
      fictionalCharacter: 'Personagem de ficção',
      film: 'Filme',
      firstName: 'Nome próprio',
      fruitOrVegetable: 'Fruta ou legume',
      gift: 'Presente',
      hobby: 'Passatempo',
      instrument: 'Instrumento musical',
      job: 'Profissão',
      kitchenThing: 'Algo numa cozinha',
      lateExcuse: 'Desculpa para um atraso',
      personalityTrait: 'Traço de personalidade',
      plant: 'Planta',
      series: 'Série de TV',
      singer: 'Cantor ou cantora',
      sport: 'Desporto',
      thingInABag: 'Algo numa mala',
      tool: 'Ferramenta',
      toy: 'Brinquedo',
      vehicle: 'Veículo'
    },
    home: {
      description:
        'Sai uma letra e cada ecrã recebe a mesma folha — um país, um animal, um nome próprio — para preencher com palavras começadas por ela. Quem acabar a sua primeiro pode dizer stop. Depois a mesa vota categoria a categoria, e uma palavra que mais ninguém escreveu vale o dobro.'
    },
    host: {
      callStop: 'Dizer stop',
      cancelStop: 'Anular o stop',
      nextCategory: 'Categoria seguinte',
      toScores: 'Ver as pontuações'
    },
    letter: 'Letra {letter}',
    name: 'Stop',
    play: 'Jogar Stop',
    reveal: {
      outcome: {
        empty: 'Em branco',
        offLetter: 'Não é um {letter}',
        refused: 'Não conta',
        shared: 'Repetida',
        unique: 'Mais ninguém'
      },
      strike: 'Riscar: {answer}',
      strikeHint: 'Escolhe uma palavra para a riscar ou repor',
      title: 'A tua folha'
    },
    scoring:
      'Uma letra, uma palavra por categoria. A folha vale 100 pontos, repartidos por igual entre as categorias, e a mesa vota cada resposta: a que mais ninguém escreveu ganha a parte inteira, uma repetida ganha metade.',
    setup: {
      add: 'Adicionar',
      bank: 'Já feitas',
      categories: 'Categorias',
      count: 'Categorias por ronda',
      drawn: 'Novas a cada ronda',
      duration: 'Tempo para escrever',
      fixed: 'As mesmas em cada ronda',
      letters: 'Letras que podem sair',
      new: 'Uma categoria tua',
      newPlaceholder: 'Algo verde',
      own: 'As tuas categorias',
      remove: 'Remover {label}',
      stop: 'Uma folha cheia pode dizer stop',
      summary: defineTranslation(
        '{count:plural} · entre {min:number} e {max:number}',
        {
          plural: {
            count: {
              one: '{?} categoria',
              other: '{?} categorias',
              zero: '{?} categorias'
            }
          }
        }
      )
    },
    sheet: {
      field: '{category}, começa por {letter}',
      label: 'A tua folha'
    },
    stop: {
      barred: 'O teu stop foi anulado: os outros acabam a ronda.',
      called: '<name>{nickname}</name> disse stop',
      calledByHost: 'O anfitrião disse stop',
      calledByYou: 'Disseste stop',
      filling: 'Stop · {filled:number}/{count:number}',
      offLetter:
        'Para dizer stop, cada linha precisa de uma palavra começada por {letter}.',
      press: 'Stop!'
    },
    tagline: 'Uma letra. Preenche cada linha.',
    vote: {
      done: 'Acabei',
      doneCount: defineTranslation(
        '{done:plural} · a votação avança quando toda a gente acabar',
        {
          plural: {
            done: {
              one: '{?} acabou',
              other: '{?} acabaram',
              zero: '{?} acabaram'
            }
          }
        }
      ),
      moveOn: 'A votação avança quando toda a gente acabar.',
      of: '{index:number} de {count:number}',
      refuse: 'Não conta',
      refuseRow: 'Não conta: {answer}',
      yours: 'A tua'
    },
    wall: {
      against: '{refusals:number} contra',
      grid: 'Todas as folhas da ronda, letra {letter}',
      legendNothing: 'Não conta, não é um {letter} ou em branco · nada',
      lines: 'As categorias',
      progress: '{filled:number}/{count:number}',
      roundTotal: 'Ronda',
      sheets: 'Linhas preenchidas'
    }
  },
  player: {
    /** A seat whose screen has gone quiet — beside that name, on every board. */
    away: 'ausente',
    /** A seat that pressed *ready* between two rounds, said to a screen reader beside its name. */
    back: 'de volta à mesa',
    choosingGame: 'O anfitrião está a escolher um jogo',
    final: {
      placing: 'Ficaste em',
      rank: defineTranslation('{rank:plural}', {
        plural: {
          rank: {
            other: '{?}.º',
            type: 'ordinal'
          }
        }
      })
    },
    /** The game's last reveal, waiting on the final board. */
    gameOver: {
      detail: 'À espera dos resultados',
      title: 'Fim do jogo'
    },
    lineUp: {
      ready: 'Cá estou'
    },
    midRound: {
      detail: 'O teu lugar está guardado — esta ronda começou sem ti.',
      title: 'Próxima ronda'
    },
    nickname: {
      action: 'Entrar',
      label: 'Nome',
      title: 'Como te chamamos?'
    },
    points: defineTranslation('{points:plural}', {
      plural: { points: { one: 'ponto', other: 'pontos', zero: 'pontos' } }
    }),
    room: 'Mesa {code}',
    roomSize: '{count:number} à mesa',
    score: '{points:number}',
    seating: 'A arranjar-te um lugar…',
    standing: {
      /** Where this seat placed in the round just revealed, among the seats it paid. */
      ofRound: defineTranslation('{rank:plural} nesta ronda', {
        plural: {
          rank: {
            other: '{?}.º',
            type: 'ordinal'
          }
        }
      }),
      /**
       * This seat's place on the game's board, at the end of the overall
       * standings' heading — which is what says it is the game's.
       */
      overall: defineTranslation('{rank:plural} de {count:number}', {
        plural: {
          rank: {
            other: '{?}.º',
            type: 'ordinal'
          }
        }
      })
    },
    /** Names the lobby roster for a reader who cannot see whose names those are. */
    table: 'À mesa',
    upNext: 'Jogas a seguir',
    you: 'Tu'
  },
  preferences: {
    language: 'Idioma',
    soundCheck: {
      press: 'Testar o som',
      stop: 'Parar o teste'
    },
    theme: {
      dark: 'Escuro',
      label: 'Tema',
      light: 'Claro',
      system: 'Sistema'
    },
    volume: 'Volume da sala'
  },
  quiz: {
    category: {
      arts: 'Artes e cultura',
      capitals: 'Capitais',
      cinema: 'Cinema e TV',
      everyday: 'Dia a dia',
      flags: 'Bandeiras',
      geography: 'Geografia',
      history: 'História',
      label: 'Que temas',
      none: 'Não escolhas nenhum e tens todos os temas.',
      quotes: 'Citações',
      rebus: 'Rébus',
      science: 'Ciências',
      silhouettes: 'Silhuetas',
      sport: 'Desporto',
      videogames: 'Videojogos'
    },
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} pergunta da casa',
            other: '{?} perguntas da casa',
            zero: '{?} perguntas da casa'
          }
        }
      }),
      spent: 'Perguntas da casa esgotadas'
    },
    duration: 'Tempo por pergunta',
    flag: {
      alt: 'A bandeira a identificar'
    },
    home: {
      description:
        'História, ciência, desporto e perguntas que ninguém vê chegar. Toda a gente responde ao mesmo tempo, e a resposta certa mais rápida leva a ronda.'
    },
    language: 'Língua das perguntas',
    name: 'Quiz',
    play: 'Jogar Quiz',
    rebus: {
      alt: 'O rébus a ler:'
    },
    reveal: {
      title: 'A resposta era'
    },
    scoring: {
      buzzer:
        'Quem tocar primeiro responde em voz alta, e o anfitrião decide se está certo. 100 pontos se acertar — e uma resposta errada deixa-te fora da ronda até ao fim.',
      choice:
        'Quatro opções, e toda a gente responde ao mesmo tempo. A certa vale 100 pontos.',
      typed:
        'Toda a gente escreve a resposta ao mesmo tempo. A certa vale 100 pontos.'
    },
    silhouette: {
      alt: 'O contorno do país a identificar'
    },
    tagline: 'Uma pergunta, e quem a sabe primeiro.'
  },
  readyMade: {
    change: 'Mudar',
    heading: 'Partidas já prontas',
    hint: 'Um toque abre uma mesa já preparada, com os jogos de seguida.',
    lineUps: {
      firstGame: {
        caption: 'Nada para julgar nem explicar.',
        name: 'Primeira partida'
      },
      generalKnowledge: {
        caption: 'Para brilhar à mesa.',
        name: 'Cultura geral'
      },
      grandMix: {
        caption:
          'Cada variante de cada jogo, sem juiz, sem fim, nunca duas iguais seguidas.',
        name: 'Vale tudo'
      },
      music: {
        caption:
          'Três versões de Adivinha a música: êxitos franceses, anos 80 e bandas sonoras.',
        name: 'Especial música'
      },
      quick: {
        caption: 'A mais curta, quase nada para ler.',
        name: 'Partida rápida'
      }
    },
    loaded: '{name} está carregada.',
    oneAtATime: 'Ou um jogo de cada vez',
    open: 'Abrir',
    rounds: defineTranslation('{count:plural}', {
      plural: {
        count: { one: '{?} ronda', other: '{?} rondas', zero: '{?} rondas' }
      }
    })
  },
  reflex: {
    falseStart: {
      detail: 'Esta, vês do banco.',
      title: 'Partiste antes de o ecrã mudar.'
    },
    flip: 'JÁ',
    hold: 'Carrega antes de mudar e ficas fora da ronda.',
    home: {
      description:
        'Nada para saber, nada para dizer. O ecrã fica parado, depois muda — e os três mais rápidos pontuam, o primeiro mais do que todos. Carrega antes de mudar e essa vês do banco.'
    },
    landed: defineTranslation('{count:plural}', {
      plural: {
        count: {
          one: '{?} jogador carregou',
          other: '{?} jogadores carregaram',
          zero: '{?} jogadores carregaram'
        }
      }
    }),
    name: 'Reflexo',
    nobody: 'Ninguém se mexeu',
    notYet: 'Espera que o ecrã mude',
    play: 'Jogar Reflexo',
    pressed: 'Já está.',
    reaction: '{milliseconds:number} ms',
    scoring:
      'O ecrã muda: o mais rápido leva 100 pontos, o segundo 60, o terceiro 30. Carrega antes de mudar e ficas fora da ronda.',
    tagline: 'O ecrã muda. O mais rápido ganha.',
    tooEarly: 'cedo demais',
    waiting: 'Olho no ecrã.'
  },
  room: {
    documentTitle: '{game} — Mêlée',
    documentTitleLobby: 'Mêlée',
    pause: {
      detail: 'A ronda continua onde parou.',
      press: 'Pausa',
      resume: 'Retomar o jogo',
      title: 'Em pausa'
    }
  },
  round: {
    answer: {
      correct: 'Acertaste. Agora descansa.',
      label: 'A tua resposta',
      /**
       * Read together with `retry` under the field: this half says what the
       * guess did, that half says the way out. It is proof of delivery as much
       * as a grade — without it a wrong guess and a dropped frame look alike.
       */
      missed: 'Não é essa.',
      retry: 'Tenta as vezes que quiseres.',
      submit: 'Enviar',
      waiting: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} já respondeu',
            other: '{?} já responderam',
            zero: '{?} já responderam'
          }
        }
      })
    },
    /**
     * What the round paid, on the screen the whole room is watching. The clock's
     * share is split off rather than folded in, in the `+N` the product uses
     * everywhere else, because a lone `+4` beside a `+2` says only that two
     * players differ — the split is the rule saying itself, and it is how the
     * table learns that answering early pays without anybody explaining it.
     */
    awardWithSpeed: '{answer:number} +{speed:number}',
    /**
     * The figure beside a round clock. A clock of a minute or more reads
     * `minutes` from its first second to its last; one under a minute reads
     * `seconds`.
     */
    clock: {
      minutes: defineTranslation('{minutes:number}:{seconds:number}', {
        number: { seconds: { minimumIntegerDigits: 2 } }
      }),
      seconds: '{seconds:number}'
    },
    /** One entry of an evening's line-up nothing else tells from another of its game. */
    entryNumbered: '{name} {number:number}',
    /** The ruled heading over the board that ends the game. */
    finalStandings: 'Classificação final',
    /** The round's podium tally, under the three it paid the most: how many of those it was played on scored. */
    found: 'Acertaram: {found:number} de {total:number}',
    index: 'Ronda {index:number} de {total:number}',
    indexOpen: 'Ronda {index:number}',
    /** The word printed before the round's figures, which alone read as a score. */
    label: 'Ronda',
    /**
     * The zero arm of `scored`, and the reason the reveal draws a block on
     * every player's screen rather than only on the ones that gained: a round
     * that paid you nothing is a result, and a screen that says nothing about
     * it leaves its owner to work out from an absence whether it was even
     * scored.
     */
    missed: 'Nada desta vez.',
    nobody: 'Ninguém acertou',
    /** The round's podium cut to its first: how many more it paid. */
    othersScored: defineTranslation('{count:plural}', {
      plural: {
        count: {
          one: '+ {?} outro',
          other: '+ {?} outros',
          zero: '+ {?} outros'
        }
      }
    }),
    /**
     * The ruled heading over the game so far at a reveal, beside the round's
     * own block: no figure under it is the round's.
     */
    overallStandings: 'Classificação geral',
    scored: '+{points:number}',
    /**
     * Why two players who both got it right did not get the same. The clock
     * replaced a rank the room could count, so what it paid has to be said.
     */
    speedBonus: 'dos quais {points:number} pela rapidez',
    speedRule:
      'Contra o relógio, uma resposta perfeita vale 90 pontos, e dá-la cedo soma até mais 10.',
    /**
     * The ruled heading under the answer over every figure the round alone
     * paid — your own result, its podium, who found it.
     */
    thisRound: 'Esta ronda',
    /** A seat that never sent, paid on what its screen held as the round closed. */
    unsent: 'Não enviado: conta o que estava no teu ecrã.',
    unsentSeats: 'Não enviado, conta o que estava no ecrã: <name>{names}</name>'
  },
  slate: {
    board: {
      close: 'Recolher',
      closeItem: 'Recolher {item} e corrigir já',
      markItem: 'Corrigir {item}',
      sheets: 'As folhas',
      show: 'Corrigir',
      state: {
        closed: 'Por corrigir',
        marked: 'Corrigido',
        open: '{filled:number}/{count:number} escritas'
      }
    },
    correct: {
      blanks: 'Em branco: <name>{names}</name>',
      finish: 'Ver as pontuações',
      judge: 'Certo',
      key: {
        reveal: 'Revelar a resposta',
        title: 'A resposta'
      },
      next: 'Seguinte',
      nobody: 'Ninguém escreveu nada para este.',
      previous: 'Anterior'
    },
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} solução da casa',
            other: '{?} soluções da casa',
            zero: '{?} soluções da casa'
          }
        }
      }),
      spent: 'Soluções da casa esgotadas'
    },
    home: {
      description:
        'Coisas numeradas para adivinhar — copos para provar, fotos, preços — e cada um escreve numa folha que mais ninguém vê, pela ordem que quiser. Depois o anfitrião corrige as folhas número a número, e cada resposta que aceita vale a sua parte dos 100 pontos da folha.'
    },
    item: 'N.º {index:number}',
    itemOf: 'N.º {index:number} de {count:number}',
    items: {
      add: 'Mais um',
      label: 'Coisas para adivinhar',
      summary: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} coisa para adivinhar',
            other: '{?} coisas para adivinhar',
            zero: '{?} coisas para adivinhar'
          }
        }
      })
    },
    key: {
      field: 'Resposta para {item}',
      hint: 'Ficam neste ecrã e seguem quando as folhas abrem.',
      label: 'Soluções',
      summary: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: 'Ocultas · {?} anotada',
            other: 'Ocultas · {?} anotadas',
            zero: 'Ocultas · {?} anotadas'
          }
        }
      })
    },
    labels: {
      duplicate: 'Outra coisa já tem este nome.',
      hint: 'Deixa um campo vazio para manter o número.',
      label: 'Nomes das coisas a adivinhar',
      none: 'Numeradas 1, 2, 3…',
      some: defineTranslation('{count:plural}', {
        plural: { count: { other: '{?} com nome' } }
      })
    },
    marking: {
      now: 'Em correção'
    },
    name: 'A Ardósia',
    play: 'Jogar à Ardósia',
    prepare: {
      keys: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} resposta anotada',
            other: '{?} respostas anotadas',
            zero: '{?} respostas anotadas'
          }
        }
      }),
      title: 'Preparar a folha'
    },
    progress: '{filled:number}/{count:number}',
    scoring:
      'Cada um preenche a sua folha em segredo, depois o anfitrião corrige cada resposta. A folha vale 100 pontos, repartidos por igual entre os seus números.',
    sheet: {
      blank: 'Em branco',
      closedBeforeYou: 'Recolhido antes de chegares',
      field: 'A tua resposta para {item}',
      grid: 'A tua folha',
      key: 'Resposta: {key}',
      next: 'Seguinte',
      previous: 'Anterior',
      saved: 'Podes mudar uma resposta até o anfitrião a recolher.',
      tile: {
        empty: '{item}, vazio',
        filled: '{item}: {answer}',
        locked: '{item}, recolhido'
      }
    },
    tagline: 'Cada um escreve. Ninguém espreita.',
    verdict: {
      pending: 'O anfitrião está a corrigir…',
      right: 'Aceite',
      wrong: 'Desta vez não'
    },
    wall: {
      allCollected: 'Todas as folhas recolhidas.',
      collect: 'Recolher as folhas',
      collectRest: 'Recolher o resto',
      filling:
        'As folhas estão abertas. Escrevam o que acham que é cada número.',
      toList: 'Voltar à lista',
      toSheets: 'Voltar às folhas',
      toWall: 'Voltar à correção'
    },
    yourAnswer: 'Escreveste',
    yourSheet: 'A tua folha toda'
  },
  swatch: {
    answer: {
      hue: 'Matiz',
      label: 'A tua cor',
      send: 'Enviar a minha cor',
      sent: 'A tua cor foi enviada. À espera dos outros.',
      tone: 'Tom e luminosidade'
    },
    hidden: 'Desapareceu. Refá-la de memória.',
    home: {
      description:
        'Uma cor aparece em todos os ecrãs — um azul-petróleo desbotado, um ocre quente — durante uns segundos, e depois esconde-se. Cada um refá-la no seu ecrã, e a revelação põe cada tentativa ao lado da verdadeira, a mais próxima primeiro. Em cheio vale mais, e perto ainda pontua.'
    },
    name: 'Tons',
    play: 'Jogar aos Tons',
    rebuildDuration: 'Tempo para a refazer',
    remember: 'Memoriza esta cor',
    reveal: {
      table: 'As cores da mesa',
      title: 'A cor',
      yours: 'A tua',
      yoursUnsent: 'A tua, tirada de onde estava o cursor'
    },
    scoring:
      'Uma cor aparece, esconde-se, e tens de a refazer. Em cheio são 100 pontos, descendo até nada quanto mais longe ficares. Sem envio a tempo, conta onde estiver o teu cursor. Sem bónus de velocidade.',
    showDuration: 'Cor mostrada durante',
    tagline: 'Uma cor, uns segundos. Refá-la.'
  },
  team: {
    aloud: {
      artist: 'Artista',
      composer: 'Compositor',
      confirm: 'Pontuar',
      film: 'Filme',
      hadIt: 'Acertou',
      label: 'Quem acertou?',
      needsScreens: 'Precisa de um ecrã para cada um.',
      nobody: 'Ninguém acertou',
      title: 'Título'
    },
    /**
     * What a team is called until the host renames it, by its pawn's colour.
     * Plural nouns standing alone, so they read as a heading, beside a score
     * and after "Move to" alike.
     */
    colour: {
      pawn1: 'Vermelhos',
      pawn2: 'Azuis',
      pawn3: 'Amarelos',
      pawn4: 'Verdes',
      pawn5: 'Roxos',
      pawn6: 'Laranjas',
      pawn7: 'Rosas',
      pawn8: 'Turquesas',
      pawn9: 'Limas',
      pawn10: 'Castanhos',
      pawn11: 'Magentas',
      pawn12: 'Celestes'
    },
    count: 'Quantas equipas',
    draw: 'Sortear as equipas',
    drawNeeds:
      'Pelo menos {count:number} jogadores para fazer {count:number} equipas — ou escolhe menos equipas.',
    /** Two seats head to head, each named beside its team's pawn. */
    duel: {
      title: '<name>{first}</name> contra <name>{second}</name>'
    },
    empty: 'Ainda ninguém',
    final: {
      podium: 'Pódio individual',
      wins: defineTranslation('{points:plural}', {
        plural: {
          points: {
            one: 'vitória com {?} ponto',
            other: 'vitória com {?} pontos',
            zero: 'vitória com {?} pontos'
          }
        }
      }),
      winsOnCase: 'vitória na casa {case:number}'
    },
    join: 'Entrar',
    move: {
      label: 'Mudar {nickname} para outra equipa',
      short: 'Equipa',
      to: 'Para os <name>{team}</name>'
    },
    needsSeats:
      'As equipas começam com {count:number} jogadores — até lá, cada um joga por si.',
    pick: 'Escolhe a tua equipa',
    /** `action` names the colour press on a team's head, starting with its printed word. */
    recolour: {
      action: 'Cor dos {team}',
      label: 'Cor do peão'
    },
    redraw: 'Novo sorteio',
    rename: {
      action: 'Renomear os {team}',
      label: 'Nome da equipa',
      submit: 'Renomear'
    },
    scoring: {
      balanced: 'Equilibrada',
      balancedHint:
        'Cada equipa marca a média por jogador, para uma equipa maior não ganhar só pelo número.',
      label: 'Pontuação das equipas',
      sum: 'Somada',
      sumHint: 'Cada equipa marca todos os pontos dos seus jogadores.'
    },
    setting: {
      aloud: 'Em voz alta',
      aloudHint:
        'Ninguém entra: o ecrã da sala pergunta, as equipas gritam, e tu tocas em quem acertou.',
      aloudNeedsNoPhone:
        'Responder em voz alta exige uma mesa onde ninguém entrou: pede a toda a gente que saia primeiro.',
      chosen: 'À escolha',
      drawn: 'Sorteadas',
      label: 'Equipas',
      off: 'Cada um por si'
    },
    summary: {
      aloud: '{count:number} equipas em voz alta',
      chosen: '{count:number} equipas à escolha',
      drawn: '{count:number} equipas sorteadas',
      off: 'Sem equipas'
    },
    title: 'As equipas',
    unassigned: {
      chosen: 'Ainda sem equipa',
      drawn: 'À espera do sorteio'
    },
    yours: 'A tua equipa'
  },
  thinkalike: {
    answer: {
      label: 'A tua resposta',
      length: '{length:number}/{max:number}',
      send: 'Enviar',
      sent: 'A tua carta está pousada, virada para baixo.'
    },
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} tema da casa',
            other: '{?} temas da casa',
            zero: '{?} temas da casa'
          }
        }
      }),
      spent: 'Temas da casa esgotados'
    },
    home: {
      description:
        'Um tema aparece em todos os ecrãs — uma fruta vermelha, algo que se encontra num frigorífico — e cada um escreve a primeira coisa que lhe vem à cabeça, uma só vez, antes de o tempo acabar. Ninguém vê uma palavra antes da revelação, que vira as respostas das mais raras às mais repetidas, e cada resposta vale conforme quantos outros a escreveram também.'
    },
    language: 'Temas em',
    name: 'Pensa como a mesa',
    own: {
      add: 'Adicionar',
      description:
        'Saem antes dos da casa, por esta ordem, mesmo numa ronda que arranca sozinha. Guardados neste ecrã.',
      field: 'Tema {index:number}',
      new: 'Um novo tema',
      newPlaceholder: 'Algo que…',
      played: 'Jogado',
      remove: 'Retirar o tema {index:number}',
      summary: '{count:number} por vir',
      title: 'Os teus temas'
    },
    play: 'Jogar Pensa como a mesa',
    reveal: {
      blank: 'Nada escrito',
      crowd: defineTranslation('{count:plural}', {
        plural: {
          count: { one: '{?} carta', other: '{?} cartas', zero: '{?} cartas' }
        }
      }),
      yours: 'A tua pilha'
    },
    roundDuration: 'Tempo para escrever',
    scoring:
      'A tua resposta vale conforme quantos outros a escreveram: todos, 100 pontos; metade, 50; ninguém, nada.',
    sort: {
      close: 'Voltar às pilhas',
      drag: 'Mover «{answer}»',
      hint: 'Arrasta uma resposta para cima de outra para as contar como uma só.',
      into: 'Com «{answer}»',
      label: 'As respostas, para juntar',
      mergeWith: 'Juntar «{answer}» a…',
      open: 'Agrupar respostas',
      takeOut: 'Separar «{answer}»'
    },
    table: defineTranslation('{count:plural} de {total:number}', {
      plural: {
        count: {
          one: '{?} carta pousada',
          other: '{?} cartas pousadas',
          zero: '{?} cartas pousadas'
        }
      }
    }),
    tagline: 'Escreve o que toda a gente vai escrever.',
    waiting: 'À espera de {count:number}'
  },
  timeline: {
    answer: {
      earliest: 'O mais antigo',
      hint: 'Arrasta uma carta, ou usa as setas dela. 1 é o mais antigo.',
      label: 'A tua ordem, do mais antigo ao mais recente',
      latest: 'O mais recente',
      moveDown: 'Passar «{event}» para mais tarde',
      moveUp: 'Passar «{event}» para mais cedo',
      send: 'Enviar a minha ordem',
      sent: 'A tua ordem foi enviada. À espera dos outros.'
    },
    dealt:
      'Qual veio primeiro? Põe-nos por ordem, do mais antigo ao mais recente.',
    deck: {
      count: defineTranslation('{count:plural}', {
        plural: {
          count: {
            one: '{?} acontecimento da casa',
            other: '{?} acontecimentos da casa',
            zero: '{?} acontecimentos da casa'
          }
        }
      }),
      spent: 'Acontecimentos da casa esgotados'
    },
    duration: 'Tempo por ronda',
    home: {
      description:
        'Cinco acontecimentos aparecem de uma vez — os primeiros passos na Lua, a queda do Muro de Berlim, o primeiro iPhone, uma final do Mundial. Cada um põe-nos por ordem, do mais antigo ao mais recente, e os anos saem na revelação. Tudo certo vale o máximo, e um par trocado ainda pontua.'
    },
    name: 'Linha do tempo',
    play: 'Jogar Linha do tempo',
    reveal: {
      perfect: 'Por ordem',
      swapped: defineTranslation('{pairs:plural}', {
        plural: {
          pairs: {
            one: '{?} par trocado',
            other: '{?} pares trocados',
            zero: '{?} pares trocados'
          }
        }
      }),
      title: 'A ordem:',
      unsent: 'A ordem',
      yours: 'A tua ordem'
    },
    scoring:
      'Cinco acontecimentos para pôr por ordem, do mais antigo ao mais recente. Tudo certo vale 100 pontos, um par trocado 67, dois pares 33.',
    tagline: 'Cinco acontecimentos. Qual veio primeiro?'
  },
  wall: {
    arriving: 'A mesa está a caminho…',
    hostAway: {
      takeOver: 'Conduzir a mesa daqui',
      title: 'O anfitrião afastou-se. O jogo espera pelo seu regresso.'
    },
    menu: {
      description: 'Abre a mesa noutro ecrã e escreve o código que ele mostra.',
      failed: 'Esse código não corresponde a nada. O ecrã pode ter um novo.',
      handOver: {
        hint: 'Lê-o a partir do ecrã que vai conduzir a mesa. Entrega a mesa a quem o abrir: guarda-o para ti.',
        label: 'Conduzir a mesa noutro ecrã',
        summary: 'Este ecrã passa a ser o da sala.'
      },
      label: 'Código do ecrã',
      openHere: 'Mostrar o jogo num novo separador',
      pair: 'Mostrar a mesa lá',
      paired: 'Código aceite: a mesa está a caminho desse ecrã…'
    },
    number: 'Ecrã {number:number}',
    numberSpeaking: 'Ecrã {number:number}, com o som',
    pair: {
      backToTable: 'Voltar à minha mesa',
      description:
        'O ecrã que mostra {code} vai exibir a tua mesa, sem respostas e sem nada para carregar.',
      documentTitle: 'Mostrar uma mesa — Mêlée',
      done: 'A tua mesa está nesse ecrã.',
      failed:
        'Não resultou. O código pode ter expirado — o ecrã mostra um novo.',
      nothingHeld: {
        description:
          'Só o ecrã que conduz uma mesa a pode mostrar noutro lado. Lê o código QR a partir desse.',
        title: 'Nenhuma mesa para mostrar'
      },
      show: 'Mostrar a mesa {room}',
      title: 'Mostrar a tua mesa nesse ecrã?'
    },
    pairAgain: 'Emparelhar este ecrã',
    pairing: {
      caption: 'Lê-o a partir do ecrã que conduz a mesa',
      codeCaption: 'Ou escreve este código no menu dele',
      documentTitle: 'À espera de uma mesa — Mêlée',
      failed: 'Não conseguimos obter um código do Mêlée.',
      retry: 'Tentar outra vez',
      title: 'Este ecrã está à espera da sua mesa'
    },
    sound: 'Ligar o som'
  }
})

/**
 * Held to the English shape now, though `pt` joins `LOCALES` — and the
 * registry that would check it — only once every bank speaks Portuguese.
 */
export const PT_DICTIONARY: typeof PORTUGUESE &
  MatchingDictionary<typeof EN_DICTIONARY, typeof PORTUGUESE> = PORTUGUESE
