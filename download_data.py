import os
import urllib.request

# 1. 저장할 위치 (public/datasets)
save_dir = "./public/datasets"
if not os.path.exists(save_dir):
    os.makedirs(save_dir)

# 2. 다운로드할 파일 목록 (규칙성 있게 생성)
base_url = "https://raw.githubusercontent.com/YoungjinBD/data/main/exam/"
files = []

# 10회 ~ 5회까지 생성
for i in range(10, 4, -1):
    # 제1유형 1,2,3번
    files.append(f"{str(i).zfill(2)}_1_1.csv")
    files.append(f"{str(i).zfill(2)}_1_2.csv")
    files.append(f"{str(i).zfill(2)}_1_3.csv")
    # 제2유형 (train, test)
    files.append(f"{str(i).zfill(2)}_2_train.csv")
    files.append(f"{str(i).zfill(2)}_2_test.csv")
    # 제3유형 1,2번
    files.append(f"{str(i).zfill(2)}_3_1.csv")
    files.append(f"{str(i).zfill(2)}_3_2.csv")
    # 3유형 3번이 있는 경우도 있음 (일단 시도)
    files.append(f"{str(i).zfill(2)}_3_3.csv")

print(f"다운로드를 시작합니다... (저장위치: {save_dir})")

for file_name in files:
    url = base_url + file_name
    save_path = os.path.join(save_dir, file_name)
    
    try:
        urllib.request.urlretrieve(url, save_path)
        print(f"[성공] {file_name}")
    except Exception as e:
        # 없는 파일(3-3 등)은 에러 날 수 있음
        print(f"[건너뜀] {file_name} (파일 없음)")

print("\n모든 작업이 완료되었습니다! public/datasets 폴더를 확인하세요.")