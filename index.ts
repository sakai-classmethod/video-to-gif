import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

interface ConvertOptions {
  width?: number;
  fps?: number;
  quality?: number;
}

class GifConverter {
  private static readonly INPUT_DIR = './source';
  private static readonly OUTPUT_DIR = './output';

  // ディレクトリの初期化
  static initializeDirs(): void {
    [this.INPUT_DIR, this.OUTPUT_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`ディレクトリを作成しました: ${dir}`);
      }
    });
  }

  // 入力ファイルから出力パスを生成
  static getOutputPath(inputPath: string): string {
    const fileName = path.basename(inputPath, path.extname(inputPath));
    return path.join(this.OUTPUT_DIR, `${fileName}.gif`);
  }

  // 単一ファイルの変換
  static convert(
    inputPath: string,
    outputPath: string,
    options: ConvertOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`変換開始: ${inputPath} → ${outputPath}`);

      let command = ffmpeg(inputPath);

      if (options.width) {
        command = command.size(`${options.width}x?`);
      }
      if (options.fps) {
        command = command.fps(options.fps);
      }

      command
        .toFormat('gif')
        .on('progress', (progress) => {
          console.log(`処理中... ${Math.round(progress.percent || 0)}% 完了`);
        })
        .on('end', () => {
          console.log(`変換完了: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`変換エラー: ${inputPath}`, err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  // ディレクトリ内のすべてのファイルを変換
  static async convertAll(options: ConvertOptions = {}): Promise<void> {
    this.initializeDirs();

    const files = fs.readdirSync(this.INPUT_DIR);
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.mov', '.avi', '.wmv'].includes(ext);
    });

    if (videoFiles.length === 0) {
      console.log('変換対象のファイルが見つかりません');
      return;
    }

    console.log(`${videoFiles.length}個のファイルを変換します`);

    for (const file of videoFiles) {
      const inputPath = path.join(this.INPUT_DIR, file);
      const outputPath = this.getOutputPath(file);

      try {
        await this.convert(inputPath, outputPath, options);
      } catch (error) {
        console.error(`ファイルの変換に失敗: ${file}`, error);
      }
    }

    console.log('すべての変換が完了しました');
  }
}

// 使用例
async function main() {
  try {
    await GifConverter.convertAll({
      width: 800,
      fps: 30
    });
  } catch (error) {
    console.error('変換処理でエラーが発生:', error);
  }
}

main();