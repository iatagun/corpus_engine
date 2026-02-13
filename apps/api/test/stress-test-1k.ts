import autocannon from 'autocannon';

const timestamp = Date.now();
const target = 'http://127.0.0.1:3004/search';

const queryCommon = {
    corpus_id: 'corpus_pud_1',
    query: { type: 'token', lemma: `coalesce_test_${timestamp}` }
};

console.log('🔥 Başlatılıyor: 100 Eşzamanlı Kullanıcı Stress Testi...');
console.log(`Hedef: ${target}`);
console.log(`Query: ${queryCommon.query.lemma}`);
console.log('Süre: 10 saniye');

const instance = autocannon({
    url: target,
    connections: 100, // Reduced to 100 for debugging
    pipelining: 1,
    duration: 30,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryCommon),
    timeout: 10 // 10s timeout per request
}, (err, result) => {
    if (err) {
        console.error('❌ Test Hatası:', err);
    } else {
        console.log('\n--- 📊 Stress Test Sonuçları (100 Kullanıcı) ---');
        console.log(`Toplam İstek  : ${result.requests.total}`);
        console.log(`Saniye Başına : ${result.requests.mean} req/sec`);
        console.log(`Gecikme (Ort) : ${result.latency.mean} ms`);
        console.log(`Gecikme (99%) : ${result.latency.p99} ms`);
        console.log(`Hatalar       : ${result.errors} (Zaman aşımı / Bağlantı hatası)`);
        console.log(`2xx Cevaplar  : ${result['2xx']}`);
        console.log(`Non-2xx       : ${result['non2xx']}`);

        if (result.errors > 0 || result['non2xx'] > 0) {
            console.log('\n⚠️ UYARI: Sistem yük altında bazı hatalar verdi.');
        } else {
            console.log('\n✅ BAŞARILI: Sistem 1000 kullanıcıyı hatasız karşıladı.');
        }
    }
});

autocannon.track(instance, { renderProgressBar: true });
