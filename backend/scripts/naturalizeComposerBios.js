const path = require('path');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');

dotEnv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

/**
 * Replaces each composer's auto-generated "Composer known for scoring X, Y,
 * Z" bio — every one built from the same template, on the same sentence
 * shape — with a real, individually written one.
 *
 *   node scripts/naturalizeComposerBios.js
 */

const BIOS = {
    'Hans Zimmer': "German composer known for blending orchestral scale with electronic texture, and for a long-running partnership with Christopher Nolan that runs from The Dark Knight through Dune. Won an Oscar for The Lion King and has been nominated more than a dozen times since.",
    'Ludwig Göransson': "Swedish composer who built his early career scoring Ryan Coogler's films before winning back-to-back Oscars for Black Panther and Oppenheimer. Also responsible for The Mandalorian's theme and Tenet's score.",
    'Ramin Djawadi': "German composer best known for Game of Thrones, whose theme became one of the most recognisable pieces of music written for television. Also scores Westworld and the first Iron Man film.",
    'Hildur Guðnadóttir': "Icelandic composer and cellist who became the first woman to win a solo Oscar for Best Original Score, for Joker. Her Chernobyl score, built partly from recordings made inside a decommissioned power plant, won an Emmy.",
    'Howard Shore': "Canadian composer who wrote the entire musical world of The Lord of the Rings trilogy, earning three Oscars across the films. A frequent collaborator with David Cronenberg since the start of both their careers.",
    'John Williams': "American composer whose work on Star Wars, Jaws, E.T. and Indiana Jones defined the sound of blockbuster filmmaking for a generation. His decades-long partnership with Steven Spielberg is one of the most consequential in film history.",
    'James Horner': "American composer known for sweeping, melodic scores including Braveheart and Avatar, and for Titanic, which won him two Oscars in one night. He died in a plane crash in 2015 while still one of Hollywood's most in-demand composers.",
    'Ennio Morricone': "Italian composer whose scores for Sergio Leone's westerns, especially The Good, the Bad and the Ugly, remain some of the most instantly recognisable music in cinema. Prolific across genres for six decades, he won a competitive Oscar for The Hateful Eight after an honorary one in 2007.",
    'Justin Hurwitz': "American composer who has scored every one of Damien Chazelle's films since the two were college roommates. La La Land won him two Oscars in the same ceremony, for score and for song.",
    'Jung Jae-il': "South Korean composer and multi-instrumentalist whose score for Parasite matched the film's tonal shifts between comedy and dread. Also composed the music for Squid Game.",
    'Alexandre Desplat': "French composer with an unusually wide range, moving between Wes Anderson's precise, chamber-scale scores and the more expansive registers of The Shape of Water. Has won two Oscars, for The Grand Budapest Hotel and The Shape of Water.",
    'Michael Giacchino': "American composer who started in video games before becoming one of Pixar's regular composers, winning an Oscar for Up. Also known for the television score to Lost and, more recently, the noir-inflected music for The Batman.",
    'Joe Hisaishi': "Japanese composer whose decades-long partnership with Hayao Miyazaki produced the music for Spirited Away, My Neighbor Totoro and Princess Mononoke. His melodic, piano-led style is closely identified with Studio Ghibli.",
    'Trent Reznor': "American musician, known first as the founder of Nine Inch Nails, who moved into film scoring with longtime collaborator Atticus Ross. The two won an Oscar for The Social Network and have scored most of David Fincher's films since.",
    'Junkie XL': "Dutch producer and composer, born Tom Holkenborg, known for high-energy, percussion-driven scores including Mad Max: Fury Road. Has frequently collaborated with Hans Zimmer on large-scale blockbuster projects.",
    'Michael Abels': "American composer best known for scoring Jordan Peele's Get Out, Us and Nope, work that blends orchestral writing with unsettling vocal and choral textures.",
    'Dave Porter': "American composer who defined the sound of Breaking Bad and its spin-off Better Call Saul across their combined decade on screen, working closely with creator Vince Gilligan on both.",
    'Kyle Dixon': "American musician and member of the band Survive, who co-wrote Stranger Things' synthesizer-driven score with bandmate Michael Stein — a sound that became closely tied to the show's 1980s setting.",
    'Nicholas Britell': "American composer known for a distinctive, genre-crossing style, from the jazz-inflected score of Moonlight to Succession's satirical orchestral-hip-hop theme.",
    'Gustavo Santaolalla': "Argentine musician and composer who won consecutive Oscars for Brokeback Mountain and Babel. His spare, guitar-led style carried over into the video game and television versions of The Last of Us.",
    'Theodore Shapiro': "American composer with a background in film comedy scoring — Tropic Thunder, Trainwreck — who brought a colder, more clinical sound to Severance's corporate unease.",
    'Christopher Lennertz': "American composer for film, television and video games, known for scoring The Boys and for his earlier work on the Medal of Honor game series.",
    'Anthony Genn': "British musician, formerly of Elastica and a longtime member of Pulp, who has contributed music to Peaky Blinders alongside the show's licensed soundtrack.",
    'Thomas Newman': "American composer from the Newman family of film composers, son of Alfred Newman. Best known for American Beauty and 1917, and one of the most Oscar-nominated composers working without, until recently, a competitive win.",
};

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const Musician = require('../model/musicianModel');

    let updated = 0;
    for (const [fullName, bio] of Object.entries(BIOS)) {
        const result = await Musician.updateOne({ fullName }, { bio });
        if (result.matchedCount === 0) console.log(`  MISS  ${fullName} — no record with this name`);
        else { updated++; console.log(`  ok    ${fullName}`); }
    }

    const total = await Musician.countDocuments();
    console.log(`\n${updated} bios updated (${total} composers on record).`);

    await mongoose.disconnect();
};

run().catch((error) => { console.error(error); process.exit(1); });
