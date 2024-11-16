<script lang="ts">
	import type { PageData } from './$types.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Image from 'lucide-svelte/icons/image';
	import ChevronsDown from 'lucide-svelte/icons/chevron-down';
	import Loader from 'lucide-svelte/icons/loader';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
	import type { Info, Product } from '$lib/types.js';

	export let data: PageData;

	let password = '';
	let dialogOpen = false;
	let currentCategoryId: string = '';
	let inputImage: HTMLInputElement;
	let inputPhotos: HTMLInputElement;
	let standardProduct = true;
	let salesAmount = 0;
	let photosList: Record<string, { url: string; state: string }> = {};
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
	let subCategory = 'elite';
	let isPosting = false;

	function createProductSection() {
		const state = writable<Product>({
			id: '',
			name: '',
			image: '',
			price: 0,
			categoryId: '',
			createdAt: 0,
			editedAt: 0,
			standard: 0,
			refImages: [],
			info: {},
			techInfo: {}
		});

		function deleteTrigger(node: HTMLElement) {
			async function handleClick(e: Event) {
				if (!password) {
					alert('Vui lòng nhập key');
					return;
				}
				e.preventDefault();
				if (!!node.dataset.productid && !!node.dataset.categoryid) {
					const productItem = data.productsByCategory[node.dataset.categoryid].find(
						(product) => product.id === node.dataset.productid
					);
					if (productItem) {
						try {
							let imageList: string[] = [];
							if (productItem.refImages) {
								imageList = [...productItem.refImages];
							}
							if (productItem.image) {
								imageList.push(productItem.image);
							}

							const res = await fetch(
								`https://viet_tri_api.mkt-viettri.workers.dev/api/products/${node.dataset.productid}`,
								{
									method: 'DELETE',
									headers: {
										Authorization: `${password}`
									}
								}
							);
							if (res.ok) {
								if (imageList.length > 0) {
									const images = imageList.map((image) => image.split('/').pop()) as string[];
									await Promise.all(images.map((image) => deleteImage(image)));
								}
								removeProduct(node.dataset.productid, node.dataset.categoryid);
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
				if (!!node.dataset.productid && !!node.dataset.categoryid) {
					console.log(node.dataset.productid);
					console.log(node.dataset.categoryid);
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function createPostTrigger(node: HTMLElement) {
			function handleClick(e: Event) {
				if (!password) {
					alert('Vui lòng nhập key');
					return;
				}
				e.preventDefault();
				if (!!node.dataset.categoryid) {
					dialogOpen = true;
					currentCategoryId = node.dataset.categoryid;
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
				if (!!node.dataset.key && !!node.dataset.type) {
					const res = await fetch(
						`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=delete&delkey=${node.dataset.key}`,
						{
							method: 'GET'
						}
					);
					const resData = (await res.json()) as any;
					if (resData.ok) {
						if (node.dataset.type === 'photos') {
							//@ts-ignore
							inputPhotos.value = null;
							photosList[node.dataset.key].state = 'deleting';
							await fetch(resData.delUrl, {
								method: 'DELETE'
							});
							delete photosList[node.dataset.key];
							photosList = { ...photosList };
						}
						if (node.dataset.type === 'thumbnail') {
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
			element: { deleteTrigger, editTrigger, createPostTrigger, removePhotoButton },
			states: { state }
		};
	}

	const {
		element: { deleteTrigger, editTrigger, createPostTrigger, removePhotoButton },
		states: { state }
	} = createProductSection();

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

	const removeProduct = (productId: string, categoryId: string) => {
		data.productsByCategory[categoryId] = data.productsByCategory[categoryId].filter(
			(product) => product.id !== productId
		);
		// Force Svelte to update by reassigning the object
		data.productsByCategory = { ...data.productsByCategory };
	};

	const addProduct = (product: Product) => {
		data.productsByCategory[product.categoryId].push(product);
		// Force Svelte to update by reassigning the object
		data.productsByCategory = { ...data.productsByCategory };
	};

	const formatCategoryName = (category: string) => {
		const mapping: Record<string, string> = {
			thangTaiKhach: 'Thang tải khách',
			thangTaiHang: 'Thang tải hàng',
			thangTaiOTo: 'Thang tải ô tô',
			thangThucPham: 'Thang thực phẩm',
			thangQuanSat: 'Thang quan sát',
			thangTaiGiuongBenh: 'Thang tải giường bệnh',
			thangTaiRac: 'Thang tải rác',
			toiTaiHang: 'Tỏi tải hàng'
		};
		return mapping[category] || category;
	};

	async function uploadFile(
		file: File,
		fileName: string,
		type: 'photos' | 'thumbnail',
		abortController?: AbortController
	) {
		if (type === 'photos') {
			const res = await fetch(
				`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=geturl&keyname=${fileName}&readExp=${3600 * 24 * 7}`,
				{
					method: 'GET'
				}
			);
			const resData = (await res.json()) as any;
			if (resData.ok) {
				try {
					photosList[fileName] = { url: '', state: 'loading' };
					await fetch(resData.signedUrl, {
						method: 'PUT',
						body: file
					});
					photosList[fileName].state = 'url';
					photosList[fileName].url = resData.objUrl;
				} catch (error) {
					delete photosList[fileName];
					photosList = { ...photosList };
				}
			}
		}
		if (type === 'thumbnail') {
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
	}

	async function handleSubmit() {
		if ($state.name) {
			$state.id = $state.name;
		}
		if (Object.keys(thumbnailList).length > 0) {
			const imageName = Object.keys(thumbnailList)[0];
			const url = `https://pub-4076f91e2c23424590fb9b7fe99e41b5.r2.dev/${imageName}`;
			$state.image = url;
		} else {
			$state.image = '';
		}
		$state.categoryId = currentCategoryId;
		if (currentCategoryId === 'thangTaiKhach') {
			$state.subCategory = subCategory;
		}
		if (standardProduct) {
			$state.standard = 1;
		} else {
			$state.standard = 0;
		}
		if (salesAmount > 0) {
			$state.sale = {
				type: 'percent',
				percent: salesAmount
			};
		}
		if (Object.keys(photosList).length > 0) {
			$state.refImages = Object.keys(photosList).map(
				(key) => `https://pub-4076f91e2c23424590fb9b7fe99e41b5.r2.dev/${key}`
			);
		} else {
			$state.refImages = [];
		}
		$state.info = elevatorInfo;
		if (!isPosting) {
			try {
				$state.createdAt = Date.now();
				$state.editedAt = Date.now();
				isPosting = true;
				const body = { ...$state };
				const res = await fetch(
					`https://viet_tri_api.mkt-viettri.workers.dev/api/products/create`,
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
					addProduct(body);
					resetState();
				} else {
					const existPhotos = [...Object.keys(photosList), ...Object.keys(thumbnailList)];
					if (existPhotos.length > 0) {
						await Promise.all(existPhotos.map((key) => deleteImage(key)));
					}
					resetState();
					alert('Sai mật khẩu hoặc Sản phẩm đã tồn tại');
				}
			} catch (error) {
				const existPhotos = [...Object.keys(photosList), ...Object.keys(thumbnailList)];
				if (existPhotos.length > 0) {
					await Promise.all(existPhotos.map((key) => deleteImage(key)));
				}
				resetState();
				alert('Có lỗi xảy ra, vui lòng thử lại');
			}
		}
	}

	function resetState() {
		$state = {
			id: '',
			name: '',
			image: '',
			price: 0,
			categoryId: '',
			createdAt: 0,
			editedAt: 0,
			standard: 0,
			refImages: [],
			info: {},
			techInfo: {}
		};
		dialogOpen = false;
		currentCategoryId = '';
		//@ts-ignore
		inputImage.value = null;
		//@ts-ignore
		inputPhotos.value = null;
		standardProduct = true;
		salesAmount = 0;
		photosList = {};
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

	async function handlePhotosChange(param: string) {
		if (param === 'thumbnail') {
			if (inputImage && inputImage.files) {
				for (const [key, photo] of Object.entries(inputImage.files)) {
					const fileName = `${crypto.randomUUID()}-${photo.name}`;
					uploadFile(photo, fileName, 'thumbnail');
				}
			}
		}
		if (param === 'photos') {
			if (inputPhotos && inputPhotos.files) {
				for (const [key, photo] of Object.entries(inputPhotos.files)) {
					const fileName = `${crypto.randomUUID()}-${photo.name}`;
					uploadFile(photo, fileName, 'photos');
				}
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
					use:createPostTrigger
					data-categoryid={categoryId}
					class="flex items-center gap-2 rounded-md bg-blue-500 px-2 py-1 text-white hover:cursor-pointer"
				>
					<CirclePlus class="h-6 w-6" />
					<span class="font-semibold">THÊM SẢN PHẨM</span>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each data.productsByCategory[categoryId] || [] as product (product.id)}
					<div
						class="relative flex items-center overflow-hidden rounded-lg border bg-white shadow-md"
					>
						<div class="absolute right-0 top-0 flex items-center gap-1">
							<div
								use:editTrigger
								data-productid={product.id}
								data-categoryid={product.categoryId}
								class="rounded-md border bg-white p-1 hover:cursor-pointer hover:bg-slate-200"
							>
								<Pencil class="h-6 w-6 text-slate-600" />
							</div>
							<div
								use:deleteTrigger
								data-productid={product.id}
								data-categoryid={product.categoryId}
								class="rounded-md border bg-white p-1 hover:cursor-pointer hover:bg-slate-200"
							>
								<Trash2 class="h-6 w-6 text-slate-600" />
							</div>
						</div>
						<img class="h-48 object-cover p-1" src={product.image} alt={product.id} />
						<h1 class=" w-full text-center text-lg font-semibold text-slate-700">{product.name}</h1>
					</div>
				{/each}
			</div>
		</section>
	{/each}
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="max-h-screen overflow-y-scroll ">
			<Dialog.Header>
				<Dialog.Title>THÊM SẢN PHẨM</Dialog.Title>
				<Dialog.Description></Dialog.Description>
			</Dialog.Header>
			<form on:submit={async () => await handleSubmit()} action="">
				<div class="flex flex-col gap-1">
					<div class="flex items-center space-x-2">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500">Mã sản phẩm * :</span
						>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={$state.name}
							placeholder="Mã sản phẩm"
							class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
							required
						/>
					</div>
					<div class="flex items-center space-x-2">
						<span class="text-sm font-medium text-slate-500">Thumbnail * :</span>
						<input
							class="hidden"
							type="file"
							accept="image/*"
							bind:this={inputImage}
							on:change={() => handlePhotosChange('thumbnail')}
						/>
						<button
							class=" flex items-center space-x-2 rounded-md border p-1 hover:bg-slate-200"
							on:click|preventDefault={() => {
								inputImage.click();
							}}
						>
							<Image class="h-[20px] w-[20px] text-green-600" />
							<span class=" text-sm font-medium text-slate-500">Photo</span>
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
						<span class="whitespace-nowrap text-sm font-medium text-slate-500"
							>Giá sản phẩm * :</span
						>
						<input
							type="number"
							id="price"
							name="price"
							bind:value={$state.price}
							placeholder="Giá sản phẩm *"
							class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
						/>
					</div>
					<div class="flex items-center justify-between space-x-4">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500">Loại thang * :</span>
						<select bind:value={currentCategoryId} class="block h-[32px] w-full rounded-md border">
							<option value="thangTaiKhach">Thang tải khách</option>
							<option value="thangTaiHang">Thang tải hàng</option>
							<option value="thangTaiOTo">Thang tải ô tô</option>
							<option value="thangThucPham">Thang thực phẩm</option>
							<option value="thangQuanSat">Thang quan sát</option>
							<option value="thangTaiGiuongBenh">Thang tải giường bệnh</option>
							<option value="thangTaiRac">Thang tải rác</option>
							<option value="toiTaiHang">Tỏi tải hàng</option>
						</select>
					</div>
					{#if currentCategoryId === 'thangTaiKhach'}
						<div class="flex items-center justify-between space-x-4">
							<span class="whitespace-nowrap text-sm font-medium text-slate-500">Phân khúc :</span>
							<select bind:value={subCategory} class="block h-[32px] w-full rounded-md border">
								<option value="elite">Elite</option>
								<option value="luxury">Luxury</option>
								<option value="premium">Premium</option>
								<option value="panorama">Panorama</option>
							</select>
						</div>
					{/if}
					<div class="flex items-center space-x-2">
						<span class="text-sm font-medium text-slate-500">Danh sách hình ảnh :</span>
						<input
							class="hidden"
							type="file"
							accept="image/*"
							multiple={true}
							bind:this={inputPhotos}
							on:change={() => handlePhotosChange('photos')}
						/>
						<button
							class=" flex items-center space-x-2 rounded-md border p-1 hover:bg-slate-200"
							on:click|preventDefault={() => {
								inputPhotos.click();
							}}
						>
							<Image class="h-[20px] w-[20px] text-green-600" />
							<span class=" text-sm font-medium text-slate-500">Photos</span>
						</button>
					</div>
					<div class="flex flex-wrap gap-2 px-4 py-2">
						{#each Object.entries(photosList) as [key, file]}
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
											data-type="photos"
											use:removePhotoButton
										>
											<Trash2 class="h-6 w-6 text-slate-700" />
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
					<div class=" flex items-center space-x-2">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500"
							>Sản phẩm tiêu chuẩn :</span
						>
						<input
							class=" h-[20px] w-[20px]"
							type="checkbox"
							bind:checked={standardProduct}
							name="standardProduct"
							id="standardProduct"
						/>
					</div>
					<div class=" flex items-center space-x-2">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500"
							>Phần trăm khuyến mãi :</span
						>
						<input
							class=" w-[100px] rounded-md border px-2 py-1 outline-none"
							type="number"
							bind:value={salesAmount}
							name="salesAmount"
							id="salesAmount"
						/>
					</div>
					<div class="flex flex-col gap-1">
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
										<span class="whitespace-nowrap text-sm font-medium text-slate-500"
											>Bao che :</span
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
										<span class="whitespace-nowrap text-sm font-medium text-slate-500"
											>Tay vịn :</span
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
				</div>
				<div class="mt-2 flex justify-end">
					<button type="submit" class="rounded-md bg-blue-500 px-4 py-2 text-white"
						>Đăng sản phẩm</button
					>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
