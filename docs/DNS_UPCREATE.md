# upcreate.co — DNS ve Elastic IP

Elastic IP’yi **AWS EC2 konsolundan** yönetirsiniz; bu repoda sabit IP tutulmaz.

## 1. AWS tarafı (sizin yapmanız gerekenler)

1. **Eski Elastic IP’yi ayırın** (isteğe bağlı): EC2 → Elastic IPs → eski adresi seçin → **Disassociate** → gerekiyorsa **Release**.
2. **Yeni Elastic IP ayırın**: **Allocate Elastic IP address** → oluşan adresi **sunucunuzun network interface’ine Associate** edin.
3. Sunucunun **Public IPv4** adresinin yeni Elastic IP olduğunu doğralayın.

## 2. Alan adı sağlayıcınızda kayıtlar

Kök alan (`upcreate.co`) için birçok DNS sağlayıcısı **CNAME kullanmaz**; genelde **A kaydı** veya **ALIAS/ANAME** kullanılır.

Aşağıdaki **`YOUR_ELASTIC_IP`** yerine AWS’de iliştirdiğiniz **gerçek IPv4** adresini yazın.

| Tür | İsim (host) | Değer | Not |
|-----|-------------|--------|-----|
| **A** | `@` veya `upcreate.co` (kök) | `YOUR_ELASTIC_IP` | Ana site / tek sunucu |
| **A** | `www` | `YOUR_ELASTIC_IP` | Basit kurulum |
| **A** | `api` | `YOUR_ELASTIC_IP` | API alt alanı (nginx’de `server_name`) |
| **A** | `panel` | `YOUR_ELASTIC_IP` | Panel alt alanı |

### CNAME ne zaman?

- **`www` → kök** kullanmak isterseniz bazı panellerde: `www` için **CNAME** `upcreate.co` veya `@ (ALIAS)** — sağlayıcıya göre değişir.
- **Tek bir “origin” hostname** kullanıyorsanız: örn. `origin.upcreate.co` için **A** → IP, diğer hostlar için **CNAME** → `origin.upcreate.co` (Cloudflare vb. uygun).

### Özet (minimal, tek EC2 + nginx)

```
upcreate.co     A    YOUR_ELASTIC_IP
www.upcreate.co A    YOUR_ELASTIC_IP   (veya CNAME → upcreate.co, sağlayıcı destekliyorsa)
api.upcreate.co A    YOUR_ELASTIC_IP   (opsiyonel)
panel.upcreate.co A  YOUR_ELASTIC_IP   (opsiyonel)
```

SSL için sunucuda **Certbot** (Let’s Encrypt) ile bu isimler için sertifika alın.

## Seçenek B: Domain Wix DNS’te kalıyorsa

Trafik hâlâ **Wix hata sayfası** (`wixErrorPagesApp`, 404) dönüyorsa, yalnızca A kaydı eklemek yetmeyebilir.

1. **Wix Dashboard** → **Domains** → `upcreate.co` → **Manage DNS** (veya **Advanced DNS**).
2. **Wix’e işaret eden eski kayıtları kaldırın / düzenleyin:**
   - Kök (`@`) ve `www` için **A** kaydı → **EC2 Elastic IP** (Wix sayfa IP’leri `185.230.x.x` gibi ise bunları silin veya EC2 IP ile değiştirin).
3. **Nameserver’lar hâlâ `ns10.wixdns.net` ise** sorun değil; önemli olan A kayıtlarının **sunucu IP’nize** gitmesi.
4. Yayılımı kontrol: `dig upcreate.co A +short` çıktısı **sizin Elastic IP** olmalı (Wix IP’leri değil).
5. Wix’te bu domain için **yayında bir site** varsa ve “Connect domain” ile bağlıysa, bazen Wix ön yüzü öncelik alır — domaini **harici hosting**e yönlendirmek veya Wix sitesini bu domainden **ayırmak** gerekebilir.

Doğrulama (yerelde): `./scripts/verify-live.sh https://upcreate.co` — `/api/v1/health` JSON dönmeli, HTML/Wix olmamalı.

## 3. Uygulama ortam değişkenleri (hatırlatma)

- Backend: `CORS_ORIGIN=https://upcreate.co,https://www.upcreate.co` (panel URL’lerini ekleyin).
- Panel: `NEXT_PUBLIC_API_URL=https://api.upcreate.co/api/v1` veya tek hostta reverse proxy ile `/api/v1`.

---

*Bu dosya yalnızca rehberdir; gerçek IP ve nginx yapılandırması altyapınıza bağlıdır.*
