<script lang="ts">
	import type { PageData } from './$types.js';
	import type { Info, PatternItem } from '$lib/types.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Image from 'lucide-svelte/icons/image';
	import ChevronsDown from 'lucide-svelte/icons/chevron-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
	import Loader from 'lucide-svelte/icons/loader';

	export let data: PageData;

	let password = '';
	let dialogOpen = false;
	let currentCategoryId:
		| 'cabin'
		| 'cuaTang'
		| 'sanCabin'
		| 'tranGia'
		| 'tayVin'
		| 'hib'
		| 'hoaVanInox'
		| 'vatLieu' = 'cabin';
	let inputImage: HTMLInputElement;
	let thumbnailList: Record<string, { url: string; state: string }> = {};
	let elevatorInfo: Info = {
		ceiling: '',
		frontWall: '',
		sideWall: '',
		backWall: '',
		handrail: '',
		cabinDoor: '',
		lobby: '',
		floors: '',
		gfnf: '',
		cabinFloor: '',
		cabinDoorType: '',
		floorDoor: '',
		protectionRail: '',
		bollard: ''
	};
	let isPosting = false;

	function createPatternSection() {
		const state = writable<PatternItem>({
			id: '',
			name: '',
			patternId: 'cabin',
			image: '',
			subId: '',
			sections: [],
			info: {}
		});

		function deleteTrigger(node: HTMLElement) {
			async function handleClick(e: Event) {
				if (!password) {
					alert('Vui lòng nhập key');
					return;
				}
				e.preventDefault();
				if (!!node.dataset.patternid && !!node.dataset.categoryid) {
					const patternItem = data.patternsByCategory[node.dataset.categoryid].find(
						(pattern) => pattern.id === node.dataset.patternid
					);
					if (patternItem) {
						try {
							const existPhoto = patternItem.image.split('/').pop() || '';
							const res = await fetch(
								`https://viet_tri_api.mkt-viettri.workers.dev/api/patterns/${node.dataset.patternid}`,
								{
									method: 'DELETE',
									headers: {
										Authorization: `${password}`
									}
								}
							);
							if (res.ok) {
								await deleteImage(existPhoto);
								removePattern(node.dataset.patternid, node.dataset.categoryid);
							} else {
								alert('Sai mật khẩu hoặc Server không hoạt động');
							}
						} catch (error) {
							alert('Có lỗi xảy ra, vui lòng thử lại');
						}
					}
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function editTrigger(node: HTMLElement) {
			function handleClick(e: Event) {
				e.preventDefault();
				if (!!node.dataset.patternid && !!node.dataset.categoryid) {
					console.log('Edit pattern:', node.dataset.patternid);
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function createPatternTrigger(node: HTMLElement) {
			function handleClick(e: Event) {
				if (!password) {
					alert('Vui lòng nhập key');
					return;
				}
				e.preventDefault();
				if (!!node.dataset.categoryid) {
					dialogOpen = true;
					currentCategoryId = node.dataset.categoryid as
						| 'cabin'
						| 'cuaTang'
						| 'sanCabin'
						| 'tranGia'
						| 'tayVin'
						| 'hib'
						| 'hoaVanInox'
						| 'vatLieu';
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function removePhotoButton(node: HTMLButtonElement) {
			const handleClick = async (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				if (!!node.dataset.key) {
					const res = await fetch(
						`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=delete&delkey=${node.dataset.key}`,
						{
							method: 'GET'
						}
					);
					const resData = (await res.json()) as any;
					if (resData.ok) {
						//@ts-ignore
						inputImage.value = null;
						thumbnailList[node.dataset.key].state = 'deleting';
						await fetch(resData.delUrl, {
							method: 'DELETE'
						});
						delete thumbnailList[node.dataset.key];
						thumbnailList = { ...thumbnailList };
					}
				}
			};
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		return {
			element: { deleteTrigger, editTrigger, createPatternTrigger, removePhotoButton },
			states: { state }
		};
	}

	const {
		element: { deleteTrigger, editTrigger, createPatternTrigger, removePhotoButton },
		states: { state }
	} = createPatternSection();

	const removePattern = (patternId: string, categoryId: string) => {
		data.patternsByCategory[categoryId] = data.patternsByCategory[categoryId].filter(
			(pattern) => pattern.id !== patternId
		);
		data.patternsByCategory = { ...data.patternsByCategory };
	};

	const addPattern = (pattern: PatternItem) => {
		data.patternsByCategory[pattern.patternId].push(pattern);
		data.patternsByCategory = { ...data.patternsByCategory };
	};

	const formatCategoryName = (category: string) => {
		const mapping: Record<string, string> = {
			cabin: 'Cabin',
			cuaTang: 'Cửa tầng',
			sanCabin: 'Sàn cabin',
			tranGia: 'Trần giả',
			tayVin: 'Tay vịn',
			hib: 'HIB',
			hoaVanInox: 'Hoa văn inox',
			vatLieu: 'Vật liệu'
		};
		return mapping[category] || category;
	};

	async function uploadFile(file: File, fileName: string) {
		const res = await fetch(
			`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=geturl&keyname=${fileName}&readExp=${3600 * 24 * 7}`,
			{
				method: 'GET'
			}
		);
		const resData = (await res.json()) as any;
		if (resData.ok) {
			try {
				thumbnailList[fileName] = { url: '', state: 'loading' };
				await fetch(resData.signedUrl, {
					method: 'PUT',
					body: file
				});
				thumbnailList[fileName].state = 'url';
				thumbnailList[fileName].url = resData.objUrl;
			} catch (error) {
				delete thumbnailList[fileName];
				thumbnailList = { ...thumbnailList };
			}
		}
	}

	async function handleImageChange() {
		if (inputImage.files) {
			for (const [key, photo] of Object.entries(inputImage.files)) {
				const fileName = `${crypto.randomUUID()}-${photo.name}`;
				uploadFile(photo, fileName);
			}
		}
	}

	function resetState() {
		$state = {
			id: '',
			name: '',
			patternId: 'cabin',
			image: '',
			subId: '',
			sections: [],
			info: {}
		};

		dialogOpen = false;
		currentCategoryId = 'cabin';
		//@ts-ignore
		inputImage.value = null;
		thumbnailList = {};
		elevatorInfo = {
			ceiling: '',
			frontWall: '',
			sideWall: '',
			backWall: '',
			handrail: '',
			cabinDoor: '',
			lobby: '',
			floors: '',
			gfnf: '',
			cabinFloor: '',
			cabinDoorType: '',
			floorDoor: '',
			protectionRail: '',
			bollard: ''
		};
		isPosting = false;
	}

	async function deleteImage(image: string) {
		
		const res = await fetch(
			`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=delete&delkey=${image}`,
			{
				method: 'GET'
			}
		);
		const resData = (await res.json()) as any;
		if (resData.ok) {
			await fetch(resData.delUrl, {
				method: 'DELETE'
			});
		}
	}

	async function handleSubmit() {
		if ($state.name) {
			$state.id = $state.name;
		}
		$state.patternId = currentCategoryId;
		if (Object.keys(thumbnailList).length > 0) {
			const imageName = Object.keys(thumbnailList)[0];
			const url = `https://pub-4076f91e2c23424590fb9b7fe99e41b5.r2.dev/${imageName}`;
			$state.image = url;
		}
		$state.info = elevatorInfo;
		if (!isPosting) {
			try {
				isPosting = true;
				const body = { ...$state };
				const res = await fetch(
					`https://viet_tri_api.mkt-viettri.workers.dev/api/patterns/create`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `${password}`
						},
						body: JSON.stringify(body)
					}
				);
				if (res.ok) {
					resetState();
					addPattern(body);
				} else {
					if (Object.keys(thumbnailList).length > 0) {
						await Promise.all(Object.keys(thumbnailList).map((key) => deleteImage(key)));
					}
					resetState();
					alert('Sai mật khẩu hoặc Mẫu đã tồn tại');
				}
				
			} catch (error) {
				if (Object.keys(thumbnailList).length > 0) {
					await Promise.all(Object.keys(thumbnailList).map((key) => deleteImage(key)));
				}
				resetState();
				alert('Có lỗi xảy ra, vui lòng thử lại');
			}
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="flex items-center space-x-2 py-2">
		<span class=" font-medium text-slate-500">Nhập key :</span>
		<input class="rounded-md border px-2 py-1 outline-none" type="password" bind:value={password} />
	</div>
	{#each data.categories as categoryId}
		<section class="mb-12">
			<div class="flex items-start space-x-4">
				<h2 class="mb-6 text-2xl font-bold capitalize">
					{formatCategoryName(categoryId)}
				</h2>
				<div
					use:createPatternTrigger
					data-categoryid={categoryId}
					class="flex items-center gap-2 rounded-md bg-blue-500 px-2 py-1 text-white hover:cursor-pointer"
				>
					<CirclePlus class="h-6 w-6" />
					<span class="font-semibold">THÊM MẪU</span>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each data.patternsByCategory[categoryId] || [] as pattern (pattern.id)}
					<div
						class="relative flex items-center overflow-hidden rounded-lg border bg-white shadow-md"
					>
						<div class="absolute right-0 top-0 flex items-center gap-1">
							<div
								use:editTrigger
								data-patternid={pattern.id}
								data-categoryid={pattern.patternId}
								class="rounded-md border bg-white p-1 hover:cursor-pointer hover:bg-slate-200"
							>
								<Pencil class="h-6 w-6 text-slate-600" />
							</div>
							<div
								use:deleteTrigger
								data-patternid={pattern.id}
								data-categoryid={pattern.patternId}
								class="rounded-md border bg-white p-1 hover:cursor-pointer hover:bg-slate-200"
							>
								<Trash2 class="h-6 w-6 text-slate-600" />
							</div>
						</div>
						<img class="h-48 object-cover p-1" src={pattern.image} alt={pattern.id} />
						<h1 class="w-full text-center text-lg font-semibold text-slate-700">{pattern.name}</h1>
					</div>
				{/each}
			</div>
		</section>
	{/each}

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="max-h-screen overflow-y-scroll">
			<Dialog.Header>
				<Dialog.Title>THÊM MẪU MỚI</Dialog.Title>
			</Dialog.Header>
			<form on:submit={async () => await handleSubmit()}>
				<div class="flex flex-col space-y-2">
					<div class="flex items-center space-x-2">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500">Tên mẫu * :</span>
						<input
							type="text"
							bind:value={$state.name}
							placeholder="Tên mẫu"
							class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
							required
						/>
					</div>

					<div class="flex items-center space-x-2">
						<span class="text-sm font-medium text-slate-500">Hình ảnh * :</span>
						<input
							class="hidden"
							type="file"
							accept="image/*"
							bind:this={inputImage}
							on:change={handleImageChange}
						/>
						<button
							class="flex items-center space-x-2 rounded-md border p-1 hover:bg-slate-200"
							on:click|preventDefault={() => inputImage.click()}
						>
							<Image class="h-[20px] w-[20px] text-green-600" />
							<span class="text-sm font-medium text-slate-500">Chọn ảnh</span>
						</button>
					</div>

					<div class="flex flex-wrap gap-2 px-4 py-2">
						{#each Object.entries(thumbnailList) as [key, file]}
							<div class="">
								{#if file.state === 'loading' || file.state === 'deleting'}
									<div class="relative h-[200px] w-[266px] rounded-md bg-slate-100">
										<div
											class=" absolute inset-0 top-0 ml-[50%] flex w-full -translate-x-[50%] items-center justify-center space-x-2"
										>
											<Loader class=" h-6 w-6 animate-spin text-slate-400" />
											<span class=" text-lg font-medium text-slate-400">{file.state}</span>
										</div>
									</div>
								{/if}
								{#if file.state === 'url'}
									<div class="relative h-full">
										<img
											class="aspect-[4/3] h-[200px] rounded-sm border object-contain object-center"
											height={200}
											src={file.url}
											alt={key}
										/>
										<button
											class=" absolute right-0 top-0 z-10 mr-1 mt-1 rounded-md bg-white p-1 hover:bg-slate-200"
											data-key={key}
											data-type="thumbnail"
											use:removePhotoButton
										>
											<Trash2 class="h-6 w-6 text-slate-700" />
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>

					<div class="flex items-center justify-between space-x-4">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500">Loại mẫu * :</span>
						<select
							bind:value={currentCategoryId}
							class="block h-[32px] w-full rounded-md border outline-none"
						>
							<option value="cabin">Cabin</option>
							<option value="cuaTang">Cửa tầng</option>
							<option value="sanCabin">Sàn cabin</option>
							<option value="tranGia">Trần giả</option>
							<option value="tayVin">Tay vịn</option>
							<option value="hib">HIB</option>
							<option value="hoaVanInox">Hoa văn inox</option>
							<option value="vatLieu">Vật liệu</option>
						</select>
					</div>
					<div class="flex items-center space-x-2">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500">Phân loại :</span>
						<input
							type="text"
							bind:value={$state.subId}
							placeholder="Phân loại"
							class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
						/>
					</div>
				</div>
				<div class="mt-2 flex flex-col gap-1">
					<Collapsible.Root>
						<Collapsible.Trigger>
							<div
								class=" flex items-center space-x-2 rounded-md border px-2 py-1 hover:bg-slate-100"
							>
								<span class=" text-sm font-semibold text-slate-600">Thông tin sản phẩm</span>
								<ChevronsDown class="h-6 w-6 text-blue-600" />
							</div>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<div class="flex flex-col gap-1 border bg-slate-100 px-2">
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Cửa tầng chính :</span
									>
									<input
										type="text"
										id="lobby"
										name="lobby"
										bind:value={elevatorInfo.lobby}
										placeholder="Cửa tầng chính"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Cửa tầng khác :</span
									>
									<input
										type="text"
										id="floors"
										name="floors"
										bind:value={elevatorInfo.floors}
										placeholder="Cửa tầng khác"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Cửa cabin :</span
									>
									<input
										type="text"
										id="cabinDoor"
										name="cabinDoor"
										bind:value={elevatorInfo.cabinDoor}
										placeholder="Cửa cabin"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500">Bao che :</span
									>
									<input
										type="text"
										id="gfnf"
										name="gfnf"
										bind:value={elevatorInfo.gfnf}
										placeholder="Bao che"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500">Trần :</span>
									<input
										type="text"
										id="ceiling"
										name="ceiling"
										bind:value={elevatorInfo.ceiling}
										placeholder="Trần"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Sàn cabin :</span
									>
									<input
										type="text"
										id="cabinFloor"
										name="cabinFloor"
										bind:value={elevatorInfo.cabinFloor}
										placeholder="Sàn cabin"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Vách trước :</span
									>
									<input
										type="text"
										id="frontWall"
										name="frontWall"
										bind:value={elevatorInfo.frontWall}
										placeholder="Vách trước"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Vách sau :</span
									>
									<input
										type="text"
										id="backWall"
										name="backWall"
										bind:value={elevatorInfo.backWall}
										placeholder="Vách sau"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Vách hông :</span
									>
									<input
										type="text"
										id="sideWall"
										name="sideWall"
										bind:value={elevatorInfo.sideWall}
										placeholder="Vách hông"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500">Tay vịn :</span
									>
									<input
										type="text"
										id="handrail"
										name="handrail"
										bind:value={elevatorInfo.handrail}
										placeholder="Tay vịn"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Nẹp bảo vệ :</span
									>
									<input
										type="text"
										id="protectionRail"
										name="protectionRail"
										bind:value={elevatorInfo.protectionRail}
										placeholder="Nẹp bảo vệ"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
								<div class="flex items-center justify-between space-x-4">
									<span class="whitespace-nowrap text-sm font-medium text-slate-500"
										>Trụ bảo vệ :</span
									>
									<input
										type="text"
										id="bollard"
										name="bollard"
										bind:value={elevatorInfo.bollard}
										placeholder="Trụ bảo vệ"
										class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
									/>
								</div>
							</div>
						</Collapsible.Content>
					</Collapsible.Root>
				</div>
				<div class="mt-4 flex justify-end">
					<button type="submit" class="rounded-md bg-blue-500 px-4 py-2 text-white">
						Lưu mẫu
					</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
