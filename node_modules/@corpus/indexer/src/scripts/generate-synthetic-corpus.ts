import fs from 'fs';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'synthetic_100k.conllu');
const COUNT = 100000;

const VOCAB = {
    NOUN: ['cat', 'dog', 'man', 'woman', 'telescope', 'park', 'bird', 'computer', 'system', 'time'],
    VERB: ['run', 'jump', 'see', 'saw', 'eat', 'sleep', 'program', 'debug', 'compile', 'fail'],
    ADJ: ['quick', 'lazy', 'brown', 'red', 'happy', 'sad', 'fast', 'slow', 'complex', 'simple'],
    DET: ['the', 'a', 'an', 'this', 'that'],
    ADP: ['in', 'on', 'with', 'by', 'for', 'from']
};

const TEMPLATES = [
    ['DET', 'ADJ', 'NOUN', 'VERB', 'ADP', 'DET', 'NOUN'], // The quick cat runs in the park
    ['DET', 'NOUN', 'VERB', 'DET', 'NOUN'], // A bird sees the worm
    ['NOUN', 'VERB'], // Time flies
];

function getRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateSentence(id: number): string {
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const tokens: string[] = [];

    // Header
    let output = `# sent_id = synth_${id}\n# text = Synthetic sentence\n`;

    // Tokens
    template.forEach((pos, idx) => {
        const lemma = getRandom(VOCAB[pos as keyof typeof VOCAB] || ['thing']);
        const form = lemma; // Simplify for synth
        const head = idx === 0 ? 0 : idx; // Simplified dependency
        const deprel = idx === 0 ? 'root' : 'dep';

        output += `${idx + 1}\t${form}\t${lemma}\t${pos}\t${pos}\t_\t${head}\t${deprel}\t_\t_\n`;
    });

    return output + '\n';
}

const stream = fs.createWriteStream(OUTPUT_FILE);

console.log(`Generating ${COUNT} sentences to ${OUTPUT_FILE}...`);

for (let i = 0; i < COUNT; i++) {
    stream.write(generateSentence(i));
    if (i % 10000 === 0) process.stdout.write('.');
}

// Add specific Needle in Haystack for specific queries
// "The complex system fails debug" (ADJ ADJ NOUN VERB VERB - rare pattern)
const needle = `# sent_id = needle_1
# text = The complex system fails debug
1	The	the	DET	DET	_	3	det	_	_
2	complex	complex	ADJ	ADJ	_	3	amod	_	_
3	system	system	NOUN	NOUN	_	4	nsubj	_	_
4	fails	fail	VERB	VERB	_	0	root	_	_
5	debug	debug	VERB	VERB	_	4	xcomp	_	_

`;
stream.write(needle);

stream.end();
console.log('\nDone.');
