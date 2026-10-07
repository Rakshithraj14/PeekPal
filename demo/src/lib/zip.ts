// Minimal ZIP writer (stored, no compression): the sheets are already compressed webp.

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})

function crc32(bytes: Uint8Array) {
  let c = ~0
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8)
  return ~c >>> 0
}

export function zip(files: { name: string; data: Uint8Array }[]): Blob {
  const enc = new TextEncoder()
  const body: BlobPart[] = []
  const central: BlobPart[] = []
  let offset = 0
  let centralSize = 0
  const DATE = (1 << 5) | 1 // 1980-01-01, the zip epoch

  for (const f of files) {
    const name = enc.encode(f.name)
    const crc = crc32(f.data)
    const size = f.data.length

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true) // version needed
    local.setUint16(12, DATE, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, size, true)
    local.setUint32(22, size, true)
    local.setUint16(26, name.length, true)
    body.push(local, name, f.data as Uint8Array<ArrayBuffer>)

    const entry = new DataView(new ArrayBuffer(46))
    entry.setUint32(0, 0x02014b50, true)
    entry.setUint16(4, 20, true) // version made by
    entry.setUint16(6, 20, true) // version needed
    entry.setUint16(14, DATE, true)
    entry.setUint32(16, crc, true)
    entry.setUint32(20, size, true)
    entry.setUint32(24, size, true)
    entry.setUint16(28, name.length, true)
    entry.setUint32(42, offset, true)
    central.push(entry, name)

    offset += 30 + name.length + size
    centralSize += 46 + name.length
  }

  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, centralSize, true)
  end.setUint32(16, offset, true)
  return new Blob([...body, ...central, end], { type: 'application/zip' })
}

export function dataUrlBytes(url: string) {
  const bin = atob(url.slice(url.indexOf(',') + 1))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}
